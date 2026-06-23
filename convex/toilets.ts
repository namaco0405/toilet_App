import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const toiletTypeValidator = v.union(
  v.literal("japanese"),
  v.literal("western"),
  v.literal("multipurpose"),
  v.literal("other")
);

export const createToilet = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    type: toiletTypeValidator,
    notes: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
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
    });
  },
});

export const updateToilet = mutation({
  args: {
    toiletId: v.id("toilets"),
    clerkId: v.string(),
    name: v.optional(v.string()),
    type: v.optional(toiletTypeValidator),
    notes: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    imageStorageId: v.optional(v.id("_storage")),
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

    const { toiletId, clerkId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(args.toiletId, filteredUpdates);
    return args.toiletId;
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

export const getFriendsToilets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    const toilets = await Promise.all(
      friendIds.map((friendId) =>
        ctx.db
          .query("toilets")
          .withIndex("by_user", (q) => q.eq("userId", friendId))
          .collect()
      )
    );

    return toilets.flat();
  },
});

export const getAllVisibleToilets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return { myToilets: [], friendsToilets: [] };

    const myToilets = await ctx.db
      .query("toilets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    const friendToiletsArrays = await Promise.all(
      friendIds.map((friendId) =>
        ctx.db
          .query("toilets")
          .withIndex("by_user", (q) => q.eq("userId", friendId))
          .collect()
      )
    );

    return {
      myToilets,
      friendsToilets: friendToiletsArrays.flat(),
    };
  },
});

export const getToiletById = query({
  args: { toiletId: v.id("toilets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.toiletId);
  },
});

export const searchToilets = query({
  args: {
    clerkId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    const visibleUserIds = [user._id, ...friendIds];

    const allToilets = await ctx.db.query("toilets").collect();

    const term = args.searchTerm.toLowerCase();
    return allToilets.filter(
      (t) =>
        visibleUserIds.includes(t.userId) &&
        (t.name.toLowerCase().includes(term) ||
          (t.notes && t.notes.toLowerCase().includes(term)))
    );
  },
});
