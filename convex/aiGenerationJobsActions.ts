"use node";

import { v } from "convex/values";
import OpenAI from "openai";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api, internal } from "./_generated/api";
import { action } from "./_generated/server";
import { OPENAI_API_KEY, OPENAI_MONTHLY_SPEND_LIMIT_CENTS } from "./config";
import { requireAuth } from "./lib";
import { calculateCostCents } from "./modelPricing";

const FILM_GRAIN_PROMPT = [
  "Apply natural 35mm analog film grain to this image.",
  "Photorealistic film texture with realistic grain clumping, subtle tonal variation,",
  "and organic directionality. Preserve all original image details, colors, and composition.",
  "No heavy retouching, no artificial sharpening, no watermark.",
].join(" ");

function computeOutputSize(origW: number, origH: number): string {
  const roundTo16 = (n: number) => Math.round(n / 16) * 16;
  let outW = roundTo16(origW);
  let outH = roundTo16(origH);
  const maxPixels = 8_294_400;
  if (outW * outH > maxPixels) {
    const scale = Math.sqrt(maxPixels / (outW * outH));
    outW = roundTo16(outW * scale);
    outH = roundTo16(outH * scale);
  }
  return `${outW}x${outH}`;
}

async function resizeImageForInput(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

async function callOpenAI(
  apiKey: string,
  prompt: string,
  imageBase64: string,
  outputSize: string,
): Promise<{
  resultB64: string;
  usage: { inputTokens: number; outputTokens: number; model: string };
}> {
  const openai = new OpenAI({ apiKey });
  const genResponse = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            detail: "auto" as const,
            image_url: `data:image/webp;base64,${imageBase64}`,
          },
        ],
      },
    ],
    tools: [{ type: "image_generation", size: outputSize, quality: "auto", action: "edit" }],
  });

  const resultB64 = genResponse.output
    .filter((o) => o.type === "image_generation_call")
    .map((o) => o.result)[0];

  if (!resultB64) throw new Error("No image data in OpenAI response");
  return {
    resultB64,
    usage: {
      inputTokens: genResponse.usage?.input_tokens ?? 0,
      outputTokens: genResponse.usage?.output_tokens ?? 0,
      model: genResponse.model,
    },
  };
}

async function generateThumbnail(buffer: Buffer): Promise<string> {
  const thumbnailBuffer = await sharp(buffer).resize(128, 128, { fit: "cover" }).jpeg().toBuffer();
  return thumbnailBuffer.toString("base64");
}

export const processJob = action({
  args: {
    jobId: v.id("aiGenerationJobs"),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const subResult = await ctx.runQuery(internal.subscriptions.hasActive, {
      productKey: "ai_generation_platform",
    });

    const resolvedKey = subResult.active ? OPENAI_API_KEY : args.apiKey;

    if (!resolvedKey) {
      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId: args.jobId,
        status: "failed",
        failureReason: "No API key available. Subscribe to AI Generation or provide your own key.",
      });
      return;
    }

    if (subResult.active) {
      const now = Date.now();
      const date = new Date(now);
      const periodEnd = subResult.currentPeriodEnd
        ? subResult.currentPeriodEnd * 1000
        : new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
      const periodStart = periodEnd - 30 * 24 * 60 * 60 * 1000;

      const usedCents = await ctx.runQuery(internal.aiGenerationJobs.getMonthlyCost, {
        sinceMs: periodStart,
      });
      const limitCents = OPENAI_MONTHLY_SPEND_LIMIT_CENTS;
      if (usedCents >= limitCents) {
        const capMsg = `Monthly AI generation cost cap ($${(limitCents / 100).toFixed(2)}) exceeded. Resets ${new Date(periodEnd).toLocaleDateString()}.`;
        await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
          jobId: args.jobId,
          status: "failed",
          failureReason: capMsg,
        });
        return;
      }
    }

    const job = await ctx.runQuery(api.aiGenerationJobs.getJob, {
      jobId: args.jobId,
    });
    if (!job) throw new Error("Job not found");

    let usage: { inputTokens: number; outputTokens: number; model: string } | undefined;

    try {
      const sourceUrl = await ctx.storage.getUrl(job.sourceStorageId);
      if (!sourceUrl) throw new Error("Source image not found in storage");

      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("Failed to fetch source image");
      const sourceBuffer = Buffer.from(await response.arrayBuffer());

      const metadata = await sharp(sourceBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Could not read source image dimensions");
      }

      const outputSize = computeOutputSize(metadata.width, metadata.height);
      const processedBuffer = await resizeImageForInput(sourceBuffer);
      const { resultB64, usage: callUsage } = await callOpenAI(
        resolvedKey,
        FILM_GRAIN_PROMPT,
        processedBuffer.toString("base64"),
        outputSize,
      );
      usage = callUsage;

      const costCents = calculateCostCents(usage.inputTokens, usage.outputTokens, usage.model);
      const jobUsage = { ...usage, costCents };

      const generatedBuffer = Buffer.from(resultB64, "base64");

      const thumbnailBase64 = await generateThumbnail(generatedBuffer);

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
          usage: jobUsage,
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
        usage: jobUsage,
        thumbnailBase64,
      });
    } catch (error) {
      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId: args.jobId,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
        usage: usage
          ? {
              ...usage,
              costCents: calculateCostCents(usage.inputTokens, usage.outputTokens, usage.model),
            }
          : undefined,
      });
      throw error;
    }
  },
});
