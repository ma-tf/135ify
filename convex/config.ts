import { env } from "./_generated/server";

const freeImage = Number(env.FREE_TIER_IMAGE_LIMIT);
const freeFile = Number(env.FREE_TIER_FILE_SIZE_MB);
const freeStorage = Number(env.FREE_TIER_STORAGE_MB);
const paidImage = Number(env.PAID_TIER_IMAGE_LIMIT);
const paidFile = Number(env.PAID_TIER_FILE_SIZE_MB);
const paidStorage = Number(env.PAID_TIER_STORAGE_MB);

if ([freeImage, freeFile, freeStorage, paidImage, paidFile, paidStorage].some(isNaN)) {
  throw new Error(
    "Missing required tier config env vars: " +
      "FREE_TIER_IMAGE_LIMIT, FREE_TIER_FILE_SIZE_MB, FREE_TIER_STORAGE_MB, " +
      "PAID_TIER_IMAGE_LIMIT, PAID_TIER_FILE_SIZE_MB, PAID_TIER_STORAGE_MB",
  );
}

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
