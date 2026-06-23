import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendFriendRequest = mutation({
  args: {
    clerkId: v.string(),
    addresseeClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const requester = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const addressee = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.addresseeClerkId))
      .unique();

    if (!requester || !addressee) throw new Error("ユーザーが見つかりません");
    if (requester._id === addressee._id)
      throw new Error("自分自身にリクエストは送れません");

    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_addressee", (q) =>
        q.eq("requesterId", requester._id).eq("addresseeId", addressee._id)
      )
      .unique();

    if (existing) throw new Error("既にリクエスト送信済みです");

    const reverse = await ctx.db
      .query("friendships")
      .withIndex("by_requester_and_addressee", (q) =>
        q.eq("requesterId", addressee._id).eq("addresseeId", requester._id)
      )
      .unique();

    if (reverse && reverse.status === "accepted")
      throw new Error("既にフレンドです");

    return await ctx.db.insert("friendships", {
      requesterId: requester._id,
      addresseeId: addressee._id,
      status: "pending",
    });
  },
});

export const acceptFriendRequest = mutation({
  args: {
    clerkId: v.string(),
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("ユーザーが見つかりません");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("リクエストが見つかりません");
    if (friendship.addresseeId !== user._id)
      throw new Error("権限がありません");

    await ctx.db.patch(args.friendshipId, { status: "accepted" });
  },
});

export const rejectFriendRequest = mutation({
  args: {
    clerkId: v.string(),
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("ユーザーが見つかりません");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("リクエストが見つかりません");
    if (friendship.addresseeId !== user._id)
      throw new Error("権限がありません");

    await ctx.db.patch(args.friendshipId, { status: "rejected" });
  },
});

export const removeFriend = mutation({
  args: {
    clerkId: v.string(),
    friendshipId: v.id("friendships"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("ユーザーが見つかりません");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("フレンドが見つかりません");
    if (
      friendship.requesterId !== user._id &&
      friendship.addresseeId !== user._id
    )
      throw new Error("権限がありません");

    await ctx.db.delete(args.friendshipId);
  },
});

export const getFriends = query({
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

    const friendsWithInfo = await Promise.all([
      ...asRequester.map(async (f) => {
        const friend = await ctx.db.get(f.addresseeId);
        return { friendship: f, friend };
      }),
      ...asAddressee.map(async (f) => {
        const friend = await ctx.db.get(f.requesterId);
        return { friendship: f, friend };
      }),
    ]);

    return friendsWithInfo.filter((f) => f.friend !== null);
  },
});

export const getPendingRequests = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const pending = await ctx.db
      .query("friendships")
      .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const withRequesterInfo = await Promise.all(
      pending.map(async (f) => {
        const requester = await ctx.db.get(f.requesterId);
        return { friendship: f, requester };
      })
    );

    return withRequesterInfo.filter((f) => f.requester !== null);
  },
});

export const searchUsers = query({
  args: {
    clerkId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm || args.searchTerm.length < 2) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const allUsers = await ctx.db.query("users").collect();
    const term = args.searchTerm.toLowerCase();

    return allUsers.filter(
      (u) =>
        u._id !== currentUser?._id &&
        (u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term))
    );
  },
});
