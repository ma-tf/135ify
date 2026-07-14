import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
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
    OPENAI_MONTHLY_SPEND_LIMIT_CENTS: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    STRIPE_STORAGE_PRICE_ID: v.optional(v.string()),
    STRIPE_AI_PRICE_ID: v.optional(v.string()),
    AI_GENERATION_RATE_LIMIT_RATE: v.optional(v.string()),
    AI_GENERATION_RATE_LIMIT_PERIOD_MS: v.optional(v.string()),
    AI_GENERATION_GLOBAL_RATE: v.optional(v.string()),
    AI_GENERATION_GLOBAL_PERIOD_MS: v.optional(v.string()),
  },
});

app.use(rateLimiter);

export default app;
