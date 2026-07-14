import { env } from "./_generated/server";

const freeImage = Number(env.FREE_TIER_IMAGE_LIMIT || "36");
const freeFile = Number(env.FREE_TIER_FILE_SIZE_MB || "10");
const freeStorage = Number(env.FREE_TIER_STORAGE_MB || "360");
const paidImage = Number(env.PAID_TIER_IMAGE_LIMIT || "360");
const paidFile = Number(env.PAID_TIER_FILE_SIZE_MB || "25");
const paidStorage = Number(env.PAID_TIER_STORAGE_MB || "9216");

if ([freeImage, freeFile, freeStorage, paidImage, paidFile, paidStorage].some(isNaN)) {
  throw new Error(
    "Invalid tier config env vars: " +
      "FREE_TIER_IMAGE_LIMIT, FREE_TIER_FILE_SIZE_MB, FREE_TIER_STORAGE_MB, " +
      "PAID_TIER_IMAGE_LIMIT, PAID_TIER_FILE_SIZE_MB, PAID_TIER_STORAGE_MB",
  );
}

export const OPENAI_MONTHLY_SPEND_LIMIT_CENTS = Number(
  env.OPENAI_MONTHLY_SPEND_LIMIT_CENTS || "500",
);
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
export const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_STORAGE_PRICE_ID = env.STRIPE_STORAGE_PRICE_ID || "";
export const STRIPE_AI_PRICE_ID = env.STRIPE_AI_PRICE_ID || "";
export const SITE_URL = env.SITE_URL || "";
export const AI_GENERATION_RATE_LIMIT_RATE = Number(env.AI_GENERATION_RATE_LIMIT_RATE || "5");
export const AI_GENERATION_RATE_LIMIT_PERIOD_MS = Number(
  env.AI_GENERATION_RATE_LIMIT_PERIOD_MS || "60000",
);
export const AI_GENERATION_GLOBAL_RATE = Number(env.AI_GENERATION_GLOBAL_RATE || "60");
export const AI_GENERATION_GLOBAL_PERIOD_MS = Number(env.AI_GENERATION_GLOBAL_PERIOD_MS || "60000");

export const TIER_CONFIG = {
  free: {
    imageLimit: freeImage,
    fileSizeLimitBytes: freeFile * 1024 * 1024,
    storageLimitBytes: freeStorage * 1024 * 1024,
  },
  paid: {
    imageLimit: paidImage,
    fileSizeLimitBytes: paidFile * 1024 * 1024,
    storageLimitBytes: paidStorage * 1024 * 1024,
  },
} as const;

export type StorageTier = keyof typeof TIER_CONFIG;

export function getTierLimits(tier: string) {
  const limits = TIER_CONFIG[tier as StorageTier];
  if (!limits) return TIER_CONFIG.free;
  return limits;
}
