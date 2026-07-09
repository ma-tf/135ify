import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.union(v.string(), v.null()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]),
  images: defineTable({
    userId: v.id("users"),
    sourceStorageId: v.optional(v.id("_storage")),
    fileName: v.string(),
    params: v.object({
      selectedFilmId: v.string(),
      halationIntensity: v.number(),
      halationSpread: v.number(),
      halationThreshold: v.number(),
      vignetteIntensity: v.number(),
      vignetteFeather: v.number(),
      grainIntensity: v.number(),
    }),
    source: v.union(v.literal("openai"), v.literal("manual")),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    failureReason: v.optional(v.string()),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
  }).index("by_userId", ["userId"]),
  aiGenerationJobs: defineTable({
    userId: v.id("users"),
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
    sourceStorageId: v.id("_storage"),
    fileName: v.string(),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
    takeImageId: v.optional(v.id("images")),
    thumbnailBase64: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_takeImageId", ["takeImageId"])
    .index("by_parentImageId", ["parent.imageId"]),
});
