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

      // Stub: generate a 128x128 placeholder thumbnail
      const thumbnailBuffer = await sharp({
        create: {
          width: 128,
          height: 128,
          channels: 3,
          background: { r: 200, g: 180, b: 100 },
        },
      })
        .jpeg()
        .toBuffer();
      const thumbnailBase64 = thumbnailBuffer.toString("base64");

      // Stub: generate a full placeholder JPEG
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

      // Check quota before persisting
      const { imageCount, imageLimit } = await ctx.runQuery(api.images.getStorageUsage, {});

      if (imageCount >= imageLimit) {
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
      const response = await fetch(uploadUrl, { method: "POST", body: fullBuffer });

      if (!response.ok) {
        throw new Error("Failed to upload generated image");
      }

      const { storageId } = (await response.json()) as {
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
