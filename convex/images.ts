import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { GALLERY_IMAGE_LIMIT } from "./config";

const boundedLimit = 100;
const sizeLimit = 5 * 1024 * 1024;

const DEFAULT_PARAMS = {
  selectedFilmId: "none",
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
} as const;

async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getById = query({
  args: { imageId: v.id("images") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const doc = await ctx.db.get("images", args.imageId);
    if (!doc || doc.userId !== userId) return null;
    const sourceUrl = await ctx.storage.getUrl(doc.sourceStorageId);
    return { ...doc, sourceUrl };
  },
});

export const listByUser = query({
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const docs = await ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(boundedLimit);

    return Promise.all(
      docs.map(async (doc) => {
        const sourceUrl = await ctx.storage.getUrl(doc.sourceStorageId);
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
    if (metadata.size > sizeLimit) throw new Error("File exceeds 5MB limit");

    const imageId = ctx.db.insert("images", {
      userId,
      sourceStorageId: args.storageId,
      fileName: args.fileName,
      params: args.params ?? DEFAULT_PARAMS,
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
    await ctx.storage.delete(doc.sourceStorageId);
    await ctx.db.delete("images", args.imageId);
  },
});
