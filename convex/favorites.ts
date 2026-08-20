import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const toggleFavorite = mutation({
  args: {
    clerkId: v.string(),
    toiletId: v.id("toilets"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_toilet", (q) =>
        q.eq("userId", user._id).eq("toiletId", args.toiletId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      userId: user._id,
      toiletId: args.toiletId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const getFavoriteToiletIds = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return favorites.map((f) => f.toiletId);
  },
});

export const getFavoriteToilets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const toilets = await Promise.all(
      favorites.map((f) => ctx.db.get(f.toiletId))
    );
    return toilets.filter((t) => t !== null);
  },
});
