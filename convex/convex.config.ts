import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    FREE_TIER_IMAGE_LIMIT: v.optional(v.string()),
    FREE_TIER_FILE_SIZE_MB: v.optional(v.string()),
    FREE_TIER_STORAGE_MB: v.optional(v.string()),
    PAID_TIER_IMAGE_LIMIT: v.optional(v.string()),
    PAID_TIER_FILE_SIZE_MB: v.optional(v.string()),
    PAID_TIER_STORAGE_MB: v.optional(v.string()),
  },
});

export default app;
