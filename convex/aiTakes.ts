import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

const boundedLimit = 100;

export const create = mutation({
  args: {
    sourceImageId: v.id("images"),
    previewStorageId: v.id("_storage"),
    fullStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const sourceImage = await ctx.db.get("images", args.sourceImageId);
    if (!sourceImage) throw new Error("Source image not found");
    if (sourceImage.userId !== userId) throw new Error("Unauthorized");
    return await ctx.db.insert("aiTakes", {
      userId,
      sourceImageId: args.sourceImageId,
      previewStorageId: args.previewStorageId,
      fullStorageId: args.fullStorageId,
    });
  },
});

export const listByUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("aiTakes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(boundedLimit);

    return Promise.all(
      docs.map(async (doc) => {
        const sourceImage = await ctx.db.get("images", doc.sourceImageId);
        const previewUrl = await ctx.storage.getUrl(doc.previewStorageId);
        const fullUrl = await ctx.storage.getUrl(doc.fullStorageId);
        return {
          ...doc,
          sourceFileName: sourceImage?.fileName ?? null,
          previewUrl,
          fullUrl,
        };
      }),
    );
  },
});

export const listBySourceImage = query({
  args: { sourceImageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const sourceImage = await ctx.db.get("images", args.sourceImageId);
    if (!sourceImage) throw new Error("Source image not found");
    if (sourceImage.userId !== userId) throw new Error("Unauthorized");

    const docs = await ctx.db
      .query("aiTakes")
      .withIndex("by_sourceImageId", (q) => q.eq("sourceImageId", args.sourceImageId))
      .order("desc")
      .take(boundedLimit);

    return Promise.all(
      docs.map(async (doc) => {
        const previewUrl = await ctx.storage.getUrl(doc.previewStorageId);
        const fullUrl = await ctx.storage.getUrl(doc.fullStorageId);
        return { ...doc, previewUrl, fullUrl };
      }),
    );
  },
});

export const deleteTake = mutation({
  args: { takeId: v.id("aiTakes") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("aiTakes", args.takeId);
    if (!doc) throw new Error("AI Take not found");
    if (doc.userId !== userId) throw new Error("Unauthorized");
    await ctx.storage.delete(doc.previewStorageId);
    await ctx.storage.delete(doc.fullStorageId);
    await ctx.db.delete("aiTakes", args.takeId);
  },
});

export const deleteBySourceImage = mutation({
  args: { sourceImageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const sourceImage = await ctx.db.get("images", args.sourceImageId);
    if (!sourceImage) throw new Error("Source image not found");
    if (sourceImage.userId !== userId) throw new Error("Unauthorized");

    const docs = await ctx.db
      .query("aiTakes")
      .withIndex("by_sourceImageId", (q) => q.eq("sourceImageId", args.sourceImageId))
      .collect();

    for (const doc of docs) {
      await ctx.storage.delete(doc.previewStorageId);
      await ctx.storage.delete(doc.fullStorageId);
      await ctx.db.delete("aiTakes", doc._id);
    }
  },
});
