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
    latitude: v.number(),
    longitude: v.number(),

    hoursType: v.union(
      v.literal("24h"),
      v.literal("custom"),
      v.literal("unknown")
    ),
    customHours: v.optional(v.string()),

    fee: v.union(v.literal("free"), v.literal("paid"), v.literal("unknown")),

    facilities: v.object({
      multipurpose: v.boolean(),
      diaperChanging: v.boolean(),
      washlet: v.boolean(),
      ostomate: v.boolean(),
      separateByGender: v.boolean(),
      babyChair: v.boolean(),
      kidsToilet: v.boolean(),
    }),

    insideTicketGate: v.boolean(),
    hasParking: v.boolean(),

    notes: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),

    createdAt: v.number(),

    lastConfirmedAt: v.optional(v.number()),
    lastConfirmedStatus: v.optional(
      v.union(
        v.literal("available"),
        v.literal("unavailable"),
        v.literal("unknown")
      )
    ),
    lastCongestion: v.optional(
      v.union(
        v.literal("empty"),
        v.literal("normal"),
        v.literal("crowded"),
        v.literal("very_crowded")
      )
    ),
    cleanlinessSum: v.number(),
    cleanlinessCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  reports: defineTable({
    toiletId: v.id("toilets"),
    userId: v.id("users"),
    status: v.union(
      v.literal("available"),
      v.literal("unavailable"),
      v.literal("unknown")
    ),
    congestion: v.optional(
      v.union(
        v.literal("empty"),
        v.literal("normal"),
        v.literal("crowded"),
        v.literal("very_crowded")
      )
    ),
    cleanliness: v.optional(v.number()),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_toilet", ["toiletId"])
    .index("by_user", ["userId"])
    .index("by_toilet_and_created", ["toiletId", "createdAt"]),

  favorites: defineTable({
    userId: v.id("users"),
    toiletId: v.id("toilets"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_toilet", ["userId", "toiletId"])
    .index("by_toilet", ["toiletId"]),
});
