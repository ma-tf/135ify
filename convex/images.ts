import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";

import { mutation, query } from "./_generated/server";
import { FILE_SIZE_LIMIT_BYTES, GALLERY_IMAGE_LIMIT, GALLERY_STORAGE_LIMIT_BYTES } from "./config";
import { requireAuth } from "./lib";
export { generateUploadUrl } from "./lib";

const boundedLimit = 100;

const DEFAULT_PARAMS = {
  selectedFilmId: "none",
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
} as const;

export const getById = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("images", args.imageId);
    if (!doc || doc.userId !== userId) return null;
    const sourceUrl = doc.sourceStorageId ? await ctx.storage.getUrl(doc.sourceStorageId) : null;
    return { ...doc, sourceUrl };
  },
});

export const getStorageUsage = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    let usedBytes = 0;
    for (const doc of docs) {
      if (!doc.sourceStorageId) continue;
      const metadata = await ctx.db.system.get("_storage", doc.sourceStorageId);
      if (metadata) usedBytes += metadata.size;
    }

    return {
      usedBytes,
      imageCount: docs.length,
      imageLimit: GALLERY_IMAGE_LIMIT,
      atLimit: docs.length >= GALLERY_IMAGE_LIMIT || usedBytes >= GALLERY_STORAGE_LIMIT_BYTES,
      storageLimitBytes: GALLERY_STORAGE_LIMIT_BYTES,
    };
  },
});

export const listByUser = query({
  args: {
    source: v.optional(v.union(v.literal("openai"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    let query = ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc");

    if (args.source) {
      query = query.filter((q) => q.eq(q.field("source"), args.source));
    }

    const docs = await query.take(boundedLimit);

    return Promise.all(
      docs.map(async (doc) => {
        const sourceUrl = doc.sourceStorageId
          ? await ctx.storage.getUrl(doc.sourceStorageId)
          : null;
        return { ...doc, sourceUrl };
      }),
    );
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    params: v.optional(
      v.object({
        selectedFilmId: v.string(),
        halationIntensity: v.number(),
        halationSpread: v.number(),
        halationThreshold: v.number(),
        vignetteIntensity: v.number(),
        vignetteFeather: v.number(),
        grainIntensity: v.number(),
      }),
    ),
    source: v.union(v.literal("openai"), v.literal("manual")),
    parent: v.optional(
      v.object({
        imageId: v.optional(v.id("images")),
        fileName: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length >= GALLERY_IMAGE_LIMIT) throw new Error("Gallery image limit reached");

    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) throw new Error("File not found in storage");
    if (metadata.size > FILE_SIZE_LIMIT_BYTES) throw new Error("File exceeds 5MB limit");

    let usedBytes = 0;
    for (const doc of existing) {
      if (!doc.sourceStorageId) continue;
      const meta = await ctx.db.system.get("_storage", doc.sourceStorageId);
      if (meta) usedBytes += meta.size;
    }
    if (usedBytes + metadata.size > GALLERY_STORAGE_LIMIT_BYTES)
      throw new Error("Gallery storage limit reached");

    const imageId = ctx.db.insert("images", {
      userId,
      sourceStorageId: args.storageId,
      fileName: args.fileName,
      params: args.params ?? DEFAULT_PARAMS,
      source: args.source,
      status: "completed",
      parent: args.parent,
    });
    return imageId;
  },
});

export const updateParams = mutation({
  args: {
    imageId: v.id("images"),
    params: v.object({
      selectedFilmId: v.optional(v.string()),
      halationIntensity: v.optional(v.number()),
      halationSpread: v.optional(v.number()),
      halationThreshold: v.optional(v.number()),
      vignetteIntensity: v.optional(v.number()),
      vignetteFeather: v.optional(v.number()),
      grainIntensity: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("images", args.imageId);
    if (!doc) throw new Error("Image not found");
    if (doc.userId !== userId) throw new Error("Unauthorized");
    return await ctx.db.patch(args.imageId, { params: args.params as Doc<"images">["params"] });
  },
});

export const deleteImage = mutation({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("images", args.imageId);
    if (!doc) throw new Error("Image not found");
    if (doc.userId !== userId) throw new Error("Unauthorized");

    // Step 1: Handle aiGenerationJobs where parent.imageId matches the deleted image
    const parentJobs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_parentImageId", (q) => q.eq("parent.imageId", args.imageId))
      .collect();
    for (const job of parentJobs) {
      if (job.status === "failed") {
        if (job.overQuotaStorageId) {
          await ctx.storage.delete(job.overQuotaStorageId);
        }
        await ctx.db.delete("aiGenerationJobs", job._id);
      } else {
        await ctx.db.patch(job._id, {
          parent: { imageId: undefined, fileName: job.parent!.fileName },
        });
      }
    }

    // Step 2: Un-link orphaned children in the images table
    const children = await ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("parent.imageId"), args.imageId))
      .collect();
    for (const child of children) {
      await ctx.db.patch(child._id, {
        parent: { imageId: undefined, fileName: child.parent!.fileName },
      });
    }

    // Step 3: Handle job that generated this image as an AI take
    const takeJobs = await ctx.db
      .query("aiGenerationJobs")
      .withIndex("by_takeImageId", (q) => q.eq("takeImageId", args.imageId))
      .collect();
    for (const job of takeJobs) {
      if (job.overQuotaStorageId) {
        await ctx.storage.delete(job.overQuotaStorageId);
      }
      await ctx.db.delete("aiGenerationJobs", job._id);
    }

    // Step 4: Delete the stored file and database record
    if (doc.sourceStorageId) {
      await ctx.storage.delete(doc.sourceStorageId);
    }
    await ctx.db.delete("images", args.imageId);
  },
});
