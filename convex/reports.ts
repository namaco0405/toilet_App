import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const congestionValidator = v.union(
  v.literal("empty"),
  v.literal("normal"),
  v.literal("crowded"),
  v.literal("very_crowded")
);

export const createReport = mutation({
  args: {
    clerkId: v.string(),
    toiletId: v.id("toilets"),
    status: v.union(
      v.literal("available"),
      v.literal("unavailable"),
      v.literal("unknown")
    ),
    congestion: v.optional(congestionValidator),
    cleanliness: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");

    const toilet = await ctx.db.get(args.toiletId);
    if (!toilet) throw new Error("トイレが見つかりません");

    const now = Date.now();
    const reportId = await ctx.db.insert("reports", {
      toiletId: args.toiletId,
      userId: user._id,
      status: args.status,
      congestion: args.congestion,
      cleanliness: args.cleanliness,
      comment: args.comment?.trim() || undefined,
      createdAt: now,
    });

    const patch: Record<string, unknown> = {
      lastConfirmedAt: now,
      lastConfirmedStatus: args.status,
    };
    if (args.congestion) patch.lastCongestion = args.congestion;
    if (args.cleanliness !== undefined) {
      patch.cleanlinessSum = toilet.cleanlinessSum + args.cleanliness;
      patch.cleanlinessCount = toilet.cleanlinessCount + 1;
    }
    await ctx.db.patch(args.toiletId, patch);

    return reportId;
  },
});

export const getReportsForToilet = query({
  args: { toiletId: v.id("toilets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_toilet_and_created", (q) => q.eq("toiletId", args.toiletId))
      .order("desc")
      .take(20);
  },
});

export const getMyReports = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return [];

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return await Promise.all(
      reports.map(async (r) => ({
        report: r,
        toilet: await ctx.db.get(r.toiletId),
      }))
    );
  },
});
