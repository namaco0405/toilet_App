import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const facilitiesValidator = v.object({
  multipurpose: v.boolean(),
  diaperChanging: v.boolean(),
  washlet: v.boolean(),
  ostomate: v.boolean(),
  separateByGender: v.boolean(),
  babyChair: v.boolean(),
  kidsToilet: v.boolean(),
});

const hoursTypeValidator = v.union(
  v.literal("24h"),
  v.literal("custom"),
  v.literal("unknown")
);

const feeValidator = v.union(
  v.literal("free"),
  v.literal("paid"),
  v.literal("unknown")
);

export const createToilet = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    hoursType: hoursTypeValidator,
    customHours: v.optional(v.string()),
    fee: feeValidator,
    facilities: facilitiesValidator,
    insideTicketGate: v.boolean(),
    hasParking: v.boolean(),
    notes: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("ユーザーが見つかりません");

    const { clerkId, ...toiletData } = args;

    return await ctx.db.insert("toilets", {
      ...toiletData,
      userId: user._id,
      createdAt: Date.now(),
      cleanlinessSum: 0,
      cleanlinessCount: 0,
    });
  },
});

export const deleteToilet = mutation({
  args: {
    toiletId: v.id("toilets"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("ユーザーが見つかりません");

    const toilet = await ctx.db.get(args.toiletId);
    if (!toilet) throw new Error("トイレが見つかりません");
    if (toilet.userId !== user._id) throw new Error("権限がありません");

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_toilet", (q) => q.eq("toiletId", args.toiletId))
      .collect();
    await Promise.all(reports.map((r) => ctx.db.delete(r._id)));

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_toilet", (q) => q.eq("toiletId", args.toiletId))
      .collect();
    await Promise.all(favorites.map((f) => ctx.db.delete(f._id)));

    await ctx.db.delete(args.toiletId);
  },
});

export const getMyToilets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("toilets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getAllToilets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("toilets").order("desc").collect();
  },
});

export const getToiletById = query({
  args: { toiletId: v.id("toilets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.toiletId);
  },
});

function matchesFilters(
  t: {
    fee: string;
    hoursType: string;
    facilities: Record<string, boolean>;
    insideTicketGate: boolean;
    hasParking: boolean;
  },
  args: {
    feeMode?: "all" | "free" | "paid";
    hoursMode?: "all" | "24h" | "open_now";
    facilities?: Record<string, boolean | undefined>;
    insideTicketGate?: boolean;
    hasParking?: boolean;
  }
) {
  if (args.feeMode && args.feeMode !== "all" && t.fee !== args.feeMode) {
    return false;
  }
  if (args.hoursMode === "24h" && t.hoursType !== "24h") return false;
  if (args.hoursMode === "open_now" && t.hoursType === "unknown") return false;
  if (args.insideTicketGate && !t.insideTicketGate) return false;
  if (args.hasParking && !t.hasParking) return false;
  if (args.facilities) {
    for (const [key, want] of Object.entries(args.facilities)) {
      if (want && !t.facilities[key]) return false;
    }
  }
  return true;
}

const filterArgs = {
  feeMode: v.optional(
    v.union(v.literal("all"), v.literal("free"), v.literal("paid"))
  ),
  hoursMode: v.optional(
    v.union(v.literal("all"), v.literal("24h"), v.literal("open_now"))
  ),
  facilities: v.optional(
    v.object({
      multipurpose: v.optional(v.boolean()),
      diaperChanging: v.optional(v.boolean()),
      washlet: v.optional(v.boolean()),
      ostomate: v.optional(v.boolean()),
      separateByGender: v.optional(v.boolean()),
      babyChair: v.optional(v.boolean()),
      kidsToilet: v.optional(v.boolean()),
    })
  ),
  insideTicketGate: v.optional(v.boolean()),
  hasParking: v.optional(v.boolean()),
};

export const searchToilets = query({
  args: {
    searchTerm: v.optional(v.string()),
    ...filterArgs,
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("toilets").order("desc").collect();
    const term = (args.searchTerm ?? "").trim().toLowerCase();

    return all.filter((t) => {
      if (!matchesFilters(t, args)) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        (t.notes && t.notes.toLowerCase().includes(term))
      );
    });
  },
});

export const countFiltered = query({
  args: { ...filterArgs },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("toilets").collect();
    return all.filter((t) => matchesFilters(t, args)).length;
  },
});
