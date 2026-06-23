import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  toilets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("japanese"),
      v.literal("western"),
      v.literal("multipurpose"),
      v.literal("other")
    ),
    notes: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"])
    .index("by_requester_and_addressee", ["requesterId", "addresseeId"]),
});
