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
    STRIPE_SECRET_KEY: v.string(),
    STRIPE_WEBHOOK_SECRET: v.string(),
    OPENAI_API_KEY: v.string(),
    OPENAI_MONTHLY_SPEND_LIMIT_CENTS: v.string(),
    SITE_URL: v.optional(v.string()),
    STRIPE_STORAGE_PRICE_ID: v.optional(v.string()),
    STRIPE_AI_PRICE_ID: v.optional(v.string()),
  },
});

export default app;
