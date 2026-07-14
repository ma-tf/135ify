import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";

import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";
import { rateLimiter } from "./rateLimiter";

const BOUNDED_LIMIT = 100;

export const createJob = mutation({
  args: {
    sourceStorageId: v.id("_storage"),
    fileName: v.string(),
    apiKey: v.optional(v.string()),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const suspended = await ctx.db
      .query("aiGenerationSuspension")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (suspended) {
      throw new Error(suspended.reason ?? "Your AI generation access has been suspended.");
    }

    await rateLimiter.limit(ctx, "aiGenerationGlobal", { throws: true });
    await rateLimiter.limit(ctx, "aiGenerationPerUser", { key: userId, throws: true });

    const hasAiGeneration: boolean = await ctx.runQuery(internal.entitlements.hasEntitlement, {
      entitlement: "ai_generation_platform",
    });

    if (!hasAiGeneration && !args.apiKey) {
      throw new Error("No API key available. Subscribe to AI Generation or provide your own key.");
    }

    const jobId = await ctx.db.insert("aiGenerationJobs", {
      userId,
      status: "processing",
      sourceStorageId: args.sourceStorageId,
      fileName: args.fileName,
      parent: args.parent,
    });
    return jobId;
  },
});

export const getJob = query({
  args: { jobId: v.id("aiGenerationJobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("aiGenerationJobs", args.jobId);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});

export const setJobStatus = mutation({
  args: {
    jobId: v.id("aiGenerationJobs"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("overQuota"),
    ),
    takeImageId: v.optional(v.id("images")),
    thumbnailBase64: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    overQuotaStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("aiGenerationJobs", args.jobId);
    if (!doc || doc.userId !== userId) throw new Error("Unauthorized");
    const patch: Partial<Doc<"aiGenerationJobs">> = { status: args.status };
    if (args.takeImageId !== undefined) patch.takeImageId = args.takeImageId;
    if (args.thumbnailBase64 !== undefined) patch.thumbnailBase64 = args.thumbnailBase64;
    if (args.failureReason !== undefined) patch.failureReason = args.failureReason;
    if (args.overQuotaStorageId !== undefined) patch.overQuotaStorageId = args.overQuotaStorageId;
    await ctx.db.patch(args.jobId, patch);
  },
});

export const getOverQuotaUrl = query({
  args: { jobId: v.id("aiGenerationJobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("aiGenerationJobs", args.jobId);
    if (!doc || doc.userId !== userId) return null;
    if (!doc.overQuotaStorageId) return null;
    return ctx.storage.getUrl(doc.overQuotaStorageId);
  },
});

export const clearOverQuota = mutation({
  args: { jobId: v.id("aiGenerationJobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("aiGenerationJobs", args.jobId);
    if (!doc || doc.userId !== userId) throw new Error("Unauthorized");
    if (doc.overQuotaStorageId) {
      await ctx.storage.delete(doc.overQuotaStorageId);
    }
    await ctx.db.patch(args.jobId, { overQuotaStorageId: undefined });
  },
});

export const retryJob = mutation({
  args: { jobId: v.id("aiGenerationJobs"), apiKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const suspended = await ctx.db
      .query("aiGenerationSuspension")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (suspended) {
      throw new Error(suspended.reason ?? "Your AI generation access has been suspended.");
    }

    await rateLimiter.limit(ctx, "aiGenerationGlobal", { throws: true });
    await rateLimiter.limit(ctx, "aiGenerationPerUser", { key: userId, throws: true });

    const hasAiGeneration: boolean = await ctx.runQuery(internal.entitlements.hasEntitlement, {
      entitlement: "ai_generation_platform",
    });

    if (!hasAiGeneration && !args.apiKey) {
      throw new Error("No API key available. Subscribe to AI Generation or provide your own key.");
    }

    const doc = await ctx.db.get("aiGenerationJobs", args.jobId);
    if (!doc || doc.userId !== userId) throw new Error("Unauthorized");
    if (doc.status !== "failed") throw new Error("Only failed jobs can be retried");
    await ctx.db.patch(args.jobId, { status: "processing", failureReason: undefined });
  },
});

export const listByUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(BOUNDED_LIMIT);

    return Promise.all(
      docs.map(async (doc) => {
        let takeImageUrl: string | null = null;
        let size: number | null = null;
        if (doc.takeImageId && doc.status === "completed") {
          const image = await ctx.db.get("images", doc.takeImageId);
          if (image?.sourceStorageId) {
            takeImageUrl = await ctx.storage.getUrl(image.sourceStorageId);
            const metadata = await ctx.db.system.get("_storage", image.sourceStorageId);
            size = metadata?.size ?? null;
          }
        } else if (doc.status === "overQuota" && doc.overQuotaStorageId) {
          const metadata = await ctx.db.system.get("_storage", doc.overQuotaStorageId);
          size = metadata?.size ?? null;
        }
        return { ...doc, takeImageUrl, size };
      }),
    );
  },
});

export const latestJobTimestamp = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return docs[0] ? { _creationTime: docs[0]._creationTime } : null;
  },
});

export const suspendUser = internalMutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("aiGenerationSuspension")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return;

    await ctx.db.insert("aiGenerationSuspension", {
      userId: args.userId,
      suspendedAt: Date.now(),
      suspendedBy: adminId,
      reason: args.reason,
    });
  },
});

export const unsuspendUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const existing = await ctx.db
      .query("aiGenerationSuspension")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) return;

    await ctx.db.delete(existing._id);
  },
});
