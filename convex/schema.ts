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
    stripeCustomerId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),
  aiGenerationSuspension: defineTable({
    userId: v.id("users"),
    suspendedAt: v.number(),
    suspendedBy: v.optional(v.id("users")),
    reason: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
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
  stripeEvents: defineTable({
    body: v.string(),
    signature: v.string(),
    status: v.union(v.literal("pending"), v.literal("processed"), v.literal("failed")),
    retries: v.float64(),
    maxRetries: v.float64(),
    backoffMs: v.float64(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    eventType: v.optional(v.string()),
  }).index("by_status", ["status"]),
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    productKeys: v.array(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),
  rawUsage: defineTable({
    userId: v.id("users"),
    jobId: v.id("aiGenerationJobs"),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costCents: v.number(),
    responseId: v.string(),
    createdAt: v.number(),
    billingPeriod: v.string(),
  })
    .index("by_billingPeriod_userId", ["billingPeriod", "userId"])
    .index("by_jobId", ["jobId"]),
  aiGenerationJobs: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("overQuota"),
    ),
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
    overQuotaStorageId: v.optional(v.id("_storage")),
  })
    .index("by_userId", ["userId"])
    .index("by_takeImageId", ["takeImageId"])
    .index("by_parentImageId", ["parent.imageId"]),
});
