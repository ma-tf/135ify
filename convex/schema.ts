import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  images: defineTable({
    userId: v.string(),
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
  }).index("by_userId", ["userId"]),
});
