import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";

import { mutation, query } from "./_generated/server";
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
