import type { ProcessParams } from "@stores/file-store-types";

import { applyFilmTint } from "@features/process/apply-film-tint";
import { applyGrain } from "@features/process/apply-grain";
import { applyHalation } from "@features/process/apply-halation";
import { applyVignette } from "@features/process/apply-vignette";
import { getGrainBitmap } from "@features/process/grain-texture";

export async function processToBlobUrl(
  sourceUrl: string,
  params: ProcessParams,
  maxDimension?: number,
): Promise<string> {
  const grain = await getGrainBitmap();
  const res = await fetch(sourceUrl);
  const blob = await res.blob();
  const source = await createImageBitmap(blob);
  const resultBlob = await processImage(source, grain, params, maxDimension);
  source.close();
  return URL.createObjectURL(resultBlob);
}

function constrainDimensions(
  width: number,
  height: number,
  maxDimension?: number,
): { width: number; height: number } {
  if (!maxDimension || (width <= maxDimension && height <= maxDimension)) {
    return { width, height };
  }

  if (width > height) {
    return { width: maxDimension, height: Math.round(height * (maxDimension / width)) };
  }

  return { width: Math.round(width * (maxDimension / height)), height: maxDimension };
}

async function processImage(
  source: ImageBitmap,
  grain: ImageBitmap,
  params: ProcessParams,
  maxDimension?: number,
): Promise<Blob> {
  const { width, height } = constrainDimensions(source.width, source.height, maxDimension);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(source, 0, 0, width, height);

  applyHalation(ctx, width, height, params);
  applyFilmTint(ctx, width, height, params);
  applyVignette(ctx, width, height, params);
  applyGrain(ctx, width, height, source.width, source.height, grain, params);

  return canvas.convertToBlob({ type: "image/webp", quality: 0.92 });
}
