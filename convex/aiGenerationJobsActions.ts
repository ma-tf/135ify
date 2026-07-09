"use node";

import { v } from "convex/values";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const processJob = action({
  args: {
    jobId: v.id("aiGenerationJobs"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(api.aiGenerationJobs.getJob, { jobId: args.jobId });
    if (!job) throw new Error("Job not found");

    try {
      // Simulate AI generation latency
      await new Promise((resolve) => setTimeout(resolve, 3_000));

      // Fetch the source image from storage
      const sourceUrl = await ctx.storage.getUrl(job.sourceStorageId);
      if (!sourceUrl) throw new Error("Source image not found in storage");

      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("Failed to fetch source image");

      const fullBuffer = Buffer.from(await response.arrayBuffer());

      // Generate a real thumbnail from the source image
      const thumbnailBuffer = await sharp(fullBuffer)
        .resize(128, 128, { fit: "cover" })
        .jpeg()
        .toBuffer();
      const thumbnailBase64 = thumbnailBuffer.toString("base64");

      // Check quota before persisting
      const { imageCount, imageLimit, usedBytes, storageLimitBytes } = await ctx.runQuery(
        api.images.getStorageUsage,
        {},
      );

      if (imageCount >= imageLimit || usedBytes + fullBuffer.length > storageLimitBytes) {
        // Over quota: upload to ephemeral storage without creating an images record
        const overQuotaUploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});
        const overQuotaResponse = await fetch(overQuotaUploadUrl, {
          method: "POST",
          body: fullBuffer,
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

      // Under quota: upload and persist as a take
      const uploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});
      const uploadResponse = await fetch(uploadUrl, { method: "POST", body: fullBuffer });

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
