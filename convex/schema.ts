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
    sourceStorageId: v.id("_storage"),
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
    parentImageId: v.optional(v.id("images")),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
  }).index("by_userId", ["userId"]),
});
