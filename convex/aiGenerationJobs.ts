import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";

import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

const BOUNDED_LIMIT = 100;

export const createJob = mutation({
  args: {
    sourceStorageId: v.id("_storage"),
    fileName: v.string(),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
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
    usage: v.optional(
      v.object({
        inputTokens: v.number(),
        outputTokens: v.number(),
        costCents: v.number(),
        model: v.string(),
      }),
    ),
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
    if (args.usage !== undefined) patch.usage = args.usage;
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

export const clearResolvedTakes = mutation({
  args: { jobIds: v.array(v.id("aiGenerationJobs")) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    for (const jobId of args.jobIds) {
      const doc = await ctx.db.get("aiGenerationJobs", jobId);
      if (!doc || doc.userId !== userId) continue;
      await ctx.db.delete("aiGenerationJobs", jobId);
    }
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
  args: { jobId: v.id("aiGenerationJobs") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
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

export const getMonthlyCost = internalQuery({
  args: { sinceMs: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return docs.reduce(
      (sum, doc) => (doc._creationTime >= args.sinceMs ? sum + (doc.usage?.costCents ?? 0) : sum),
      0,
    );
  },
});

export const getAiUsage = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    usedCents: number;
    limitCents: number;
    atLimit: boolean;
    resetsAt: number;
  } | null> => {
    const userId = await requireAuth(ctx);
    const subResult = await ctx.runQuery(internal.subscriptions.hasActive, {
      productKey: "ai_generation_platform",
    });
    if (!subResult.active) return null;

    const now = Date.now();
    const date = new Date(now);
    const periodEnd = subResult.currentPeriodEnd
      ? subResult.currentPeriodEnd * 1000
      : new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    const periodStart = periodEnd - 30 * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const usedCents = docs.reduce(
      (sum, doc) => (doc._creationTime >= periodStart ? sum + (doc.usage?.costCents ?? 0) : sum),
      0,
    );
    const limitCents = Number(process.env.OPENAI_MONTHLY_SPEND_LIMIT_CENTS);

    return {
      usedCents,
      limitCents,
      atLimit: usedCents >= limitCents,
      resetsAt: periodEnd,
    };
  },
});
