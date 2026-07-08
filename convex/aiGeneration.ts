"use node";

import { v } from "convex/values";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { requireAuth } from "./lib";

type GenerateResult =
  | { status: "overQuota"; base64: string }
  | { status: "stored"; imageId: Id<"images"> };

export const generate = action({
  args: {
    sourceImageId: v.id("images"),
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateResult> => {
    await requireAuth(ctx);

    // Testing delay to simulate AI API latency
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const sourceImage = await ctx.runQuery(api.images.getById, {
      imageId: args.sourceImageId,
    });
    if (!sourceImage) throw new Error("Source image not found");

    // Stub: generate a placeholder JPEG instead of calling GPT
    const fullBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 200, g: 180, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();

    const usage = await ctx.runQuery(api.images.getStorageUsage, {});
    const estimatedTotal = fullBuffer.length;

    if (usage.usedBytes + estimatedTotal > usage.storageLimitBytes) {
      return {
        status: "overQuota" as const,
        base64: fullBuffer.toString("base64"),
      };
    }

    const uploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});

    const response = await fetch(uploadUrl, { method: "POST", body: fullBuffer });

    if (!response.ok) {
      throw new Error("Failed to upload generated image");
    }

    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };

    const imageId: Id<"images"> = await ctx.runMutation(api.images.create, {
      storageId,
      fileName: `ai-grain-${sourceImage.fileName}`,
      source: "openai",
      parent: { imageId: args.sourceImageId, fileName: sourceImage.fileName },
    });

    return { status: "stored" as const, imageId };
  },
});

export const generateFromBase64 = action({
  args: {
    sourceBase64: v.string(),
    sourceFileName: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateResult> => {
    await requireAuth(ctx);

    // Testing delay to simulate AI API latency
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const fullBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 200, g: 180, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();

    const usage = await ctx.runQuery(api.images.getStorageUsage, {});
    const estimatedTotal = fullBuffer.length;

    if (usage.usedBytes + estimatedTotal > usage.storageLimitBytes) {
      return {
        status: "overQuota" as const,
        base64: fullBuffer.toString("base64"),
      };
    }

    const uploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});

    const response = await fetch(uploadUrl, { method: "POST", body: fullBuffer });

    if (!response.ok) {
      throw new Error("Failed to upload generated image");
    }

    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };

    const imageId: Id<"images"> = await ctx.runMutation(api.images.create, {
      storageId,
      fileName: `ai-grain-${args.sourceFileName}`,
      source: "openai",
    });

    return { status: "stored" as const, imageId };
  },
});
