"use node";

import { v } from "convex/values";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { requireAuth } from "./lib";

type GenerateResult =
  | { status: "overQuota"; base64: string }
  | { status: "stored"; takeId: Id<"aiTakes"> };

export const generate = action({
  args: {
    sourceImageId: v.id("images"),
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateResult> => {
    await requireAuth(ctx);

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
    const estimatedTotal = fullBuffer.length + Math.ceil(fullBuffer.length * 0.3);

    if (usage.usedBytes + estimatedTotal > usage.storageLimitBytes) {
      return {
        status: "overQuota" as const,
        base64: fullBuffer.toString("base64"),
      };
    }

    const previewBuffer = await sharp(fullBuffer)
      .resize(1200, 1200, { fit: "inside" })
      .jpeg()
      .toBuffer();

    const [fullUploadUrl, previewUploadUrl] = await Promise.all([
      ctx.runMutation(api.lib.generateUploadUrl, {}),
      ctx.runMutation(api.lib.generateUploadUrl, {}),
    ]);

    const [fullResponse, previewResponse] = await Promise.all([
      fetch(fullUploadUrl, { method: "POST", body: fullBuffer }),
      fetch(previewUploadUrl, { method: "POST", body: previewBuffer }),
    ]);

    if (!fullResponse.ok || !previewResponse.ok) {
      throw new Error("Failed to upload generated image");
    }

    const { storageId: fullStorageId } = (await fullResponse.json()) as {
      storageId: Id<"_storage">;
    };
    const { storageId: previewStorageId } = (await previewResponse.json()) as {
      storageId: Id<"_storage">;
    };

    const takeId: Id<"aiTakes"> = await ctx.runMutation(api.aiTakes.create, {
      sourceImageId: args.sourceImageId,
      previewStorageId,
      fullStorageId,
    });

    return { status: "stored" as const, takeId };
  },
});
