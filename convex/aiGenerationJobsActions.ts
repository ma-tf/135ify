"use node";

import { v } from "convex/values";
import OpenAI from "openai";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import { action } from "./_generated/server";

const FILM_GRAIN_PROMPT = [
  "Apply natural 35mm analog film grain to this image.",
  "Photorealistic film texture with realistic grain clumping, subtle tonal variation,",
  "and organic directionality. Preserve all original image details, colors, and composition.",
  "No heavy retouching, no artificial sharpening, no watermark.",
].join(" ");

export const processJob = action({
  args: {
    jobId: v.id("aiGenerationJobs"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(api.aiGenerationJobs.getJob, { jobId: args.jobId });
    if (!job) throw new Error("Job not found");

    try {
      const sourceUrl = await ctx.storage.getUrl(job.sourceStorageId);
      if (!sourceUrl) throw new Error("Source image not found in storage");

      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("Failed to fetch source image");

      const sourceArrayBuffer = await response.arrayBuffer();
      const sourceBase64 = Buffer.from(sourceArrayBuffer).toString("base64");

      const openai = new OpenAI({ apiKey: args.apiKey });

      const genResponse = await openai.responses.create({
        model: "gpt-5.4",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: FILM_GRAIN_PROMPT },
              {
                type: "input_image",
                detail: "auto" as const,
                image_url: `data:image/png;base64,${sourceBase64}`,
              },
            ],
          },
        ],
        tools: [{ type: "image_generation" }],
      });

      const resultB64 = genResponse.output
        .filter((o) => o.type === "image_generation_call")
        .map((o) => o.result)[0];

      if (!resultB64) throw new Error("No image data in OpenAI response");

      const generatedBuffer = Buffer.from(resultB64, "base64");

      const thumbnailBuffer = await sharp(generatedBuffer)
        .resize(128, 128, { fit: "cover" })
        .jpeg()
        .toBuffer();
      const thumbnailBase64 = thumbnailBuffer.toString("base64");

      const { imageCount, imageLimit, usedBytes, storageLimitBytes } = await ctx.runQuery(
        api.images.getStorageUsage,
        {},
      );

      if (imageCount >= imageLimit || usedBytes + generatedBuffer.length > storageLimitBytes) {
        const overQuotaUploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});
        const overQuotaResponse = await fetch(overQuotaUploadUrl, {
          method: "POST",
          body: new Uint8Array(generatedBuffer),
        });
        if (!overQuotaResponse.ok) {
          throw new Error("Failed to upload over-quota image");
        }
        const { storageId: overQuotaStorageId } = (await overQuotaResponse.json()) as {
          storageId: Id<"_storage">;
        };

        await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
          jobId: args.jobId,
          status: "overQuota",
          thumbnailBase64,
          overQuotaStorageId,
        });
        return;
      }

      const uploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: new Uint8Array(generatedBuffer),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload generated image");
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: Id<"_storage">;
      };

      const imageId = await ctx.runMutation(api.images.create, {
        storageId,
        fileName: job.fileName,
        source: "openai",
        parent: job.parent ?? undefined,
      });

      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId: args.jobId,
        status: "completed",
        takeImageId: imageId,
        thumbnailBase64,
      });
    } catch (error) {
      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId: args.jobId,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
