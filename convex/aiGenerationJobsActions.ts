"use node";

import { v } from "convex/values";
import OpenAI from "openai";
import sharp from "sharp";

import type { Id } from "./_generated/dataModel";

import { api, internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
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
  usage: {
    rawResponse: string;
    inputTokens: number;
    outputTokens: number;
    model: string;
    responseId: string;
    createdAt: number;
  };
}> {
  const openai = new OpenAI({ apiKey });
  const genResponse = await openai.responses.create({
    model: "gpt-5.6",
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
    tools: [
      {
        type: "image_generation",
        size: outputSize,
        quality: "auto",
        action: "edit",
        output_format: "webp",
      },
    ],
  });

  const resultB64 = genResponse.output
    .filter((o) => o.type === "image_generation_call")
    .map((o) => o.result)[0];

  if (!resultB64) throw new Error("No image data in OpenAI response");

  const rawResponse = JSON.stringify({
    ...genResponse,
    output: genResponse.output.map((o) =>
      o.type === "image_generation_call" ? { ...o, result: "[base64 image data removed]" } : o,
    ),
  });

  return {
    resultB64,
    usage: {
      rawResponse,
      inputTokens: genResponse.usage?.input_tokens ?? 0,
      outputTokens: genResponse.usage?.output_tokens ?? 0,
      model: genResponse.model,
      responseId: genResponse.id,
      createdAt: genResponse.created_at,
    },
  };
}

async function generateThumbnail(buffer: Buffer): Promise<string> {
  const thumbnailBuffer = await sharp(buffer).resize(128, 128, { fit: "cover" }).webp().toBuffer();
  return thumbnailBuffer.toString("base64");
}

async function guardAiGeneration(
  ctx: ActionCtx,
  jobId: Id<"aiGenerationJobs">,
  providedKey: string | undefined,
): Promise<string | null> {
  const hasAiGeneration = await ctx.runQuery(internal.subscriptions.hasProductKey, {
    productKey: "ai_generation_platform",
  });

  const resolvedKey = hasAiGeneration ? OPENAI_API_KEY : providedKey;

  if (!resolvedKey) {
    await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
      jobId,
      status: "failed",
      failureReason: "No API key available. Subscribe to AI Generation or provide your own key.",
    });
    return null;
  }

  if (hasAiGeneration) {
    const now = Date.now();
    const date = new Date(now);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    const periodStart = periodEnd - 30 * 24 * 60 * 60 * 1000;

    const usedCents = await ctx.runQuery(internal.usage.getMonthlyCost, {
      sinceMs: periodStart,
    });
    const limitCents = OPENAI_MONTHLY_SPEND_LIMIT_CENTS;
    if (usedCents >= limitCents) {
      const capMsg = `Monthly AI generation cost cap ($${(limitCents / 100).toFixed(2)}) exceeded. Resets ${new Date(periodEnd).toLocaleDateString()}.`;
      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId,
        status: "failed",
        failureReason: capMsg,
      });
      return null;
    }
  }

  return resolvedKey;
}

async function fetchAndPrepareSourceImage(
  ctx: ActionCtx,
  sourceStorageId: Id<"_storage">,
): Promise<{ outputSize: string; processedBuffer: Buffer }> {
  const sourceUrl = await ctx.storage.getUrl(sourceStorageId);
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
  return { outputSize, processedBuffer };
}

async function uploadResultToStorage(
  ctx: ActionCtx,
  resultB64: string,
): Promise<{ storageId: Id<"_storage">; isOverQuota: boolean; thumbnailBase64: string }> {
  const buffer = Buffer.from(resultB64, "base64");
  const thumbnailBase64 = await generateThumbnail(buffer);

  const uploadUrl = await ctx.runMutation(api.lib.generateUploadUrl, {});
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: new Uint8Array(buffer),
  });
  if (!uploadResponse.ok) throw new Error("Failed to upload image to storage");
  const { storageId } = (await uploadResponse.json()) as { storageId: Id<"_storage"> };

  const { imageCount, imageLimit, usedBytes, storageLimitBytes } = await ctx.runQuery(
    api.images.getStorageUsage,
    {},
  );
  const isOverQuota = imageCount >= imageLimit || usedBytes + buffer.length > storageLimitBytes;

  return { storageId, isOverQuota, thumbnailBase64 };
}

export const processJob = action({
  args: {
    jobId: v.id("aiGenerationJobs"),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const resolvedKey = await guardAiGeneration(ctx, args.jobId, args.apiKey);
    if (!resolvedKey) return;

    const job = await ctx.runQuery(api.aiGenerationJobs.getJob, {
      jobId: args.jobId,
    });
    if (!job) throw new Error("Job not found");

    let usage:
      | {
          rawResponse: string;
          inputTokens: number;
          outputTokens: number;
          model: string;
          responseId: string;
          createdAt: number;
        }
      | undefined;

    try {
      const { outputSize, processedBuffer } = await fetchAndPrepareSourceImage(
        ctx,
        job.sourceStorageId,
      );
      const { resultB64, usage: callUsage } = await callOpenAI(
        resolvedKey,
        FILM_GRAIN_PROMPT,
        processedBuffer.toString("base64"),
        outputSize,
      );
      usage = callUsage;

      const costCents = calculateCostCents(usage.inputTokens, usage.outputTokens, usage.model);
      await ctx.runMutation(internal.usage.insertRawUsage, {
        jobId: args.jobId,
        model: usage.model,
        provider: "openai",
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costCents,
        responseId: usage.responseId,
        createdAt: usage.createdAt,
        rawResponse: usage.rawResponse,
      });

      const { storageId, isOverQuota, thumbnailBase64 } = await uploadResultToStorage(
        ctx,
        resultB64,
      );

      if (isOverQuota) {
        await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
          jobId: args.jobId,
          status: "overQuota",
          thumbnailBase64,
          overQuotaStorageId: storageId,
        });
        return;
      }

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
      if (usage) {
        await ctx.runMutation(internal.usage.insertRawUsage, {
          jobId: args.jobId,
          model: usage.model,
          provider: "openai",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          costCents: calculateCostCents(usage.inputTokens, usage.outputTokens, usage.model),
          responseId: usage.responseId,
          createdAt: usage.createdAt,
          rawResponse: usage.rawResponse,
        });
      }
      await ctx.runMutation(api.aiGenerationJobs.setJobStatus, {
        jobId: args.jobId,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
