import type { ProcessParams } from "@stores/file-store";

import { DEFAULT_FILM_ID, getFilmById } from "@features/process/film";
import { getGrainBitmap } from "@features/process/grain-texture";

function clamp(value: number): number {
  return Math.min(255, Math.max(0, value));
}

export const DEFAULT_PARAMS: ProcessParams = {
  selectedFilmId: DEFAULT_FILM_ID,
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
};

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

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
}

function applyHalation(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  params: ProcessParams,
) {
  if (params.halationIntensity === 0) return;

  const cutoff = (params.halationThreshold / 100) * 255;
  const spread = (params.halationSpread / 100) * 50;

  const maskCanvas = new OffscreenCanvas(width, height);
  const maskCtx = maskCanvas.getContext("2d")!;
  maskCtx.drawImage(ctx.canvas, 0, 0);

  const imageData = maskCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = Math.max(r, g, b);

    if (brightness < cutoff) {
      data[i + 3] = 0;
    } else {
      data[i] = brightness;
      data[i + 1] = Math.round(brightness * 0.3);
      data[i + 2] = Math.round(brightness * 0.1);
      data[i + 3] = 255;
    }
  }

  maskCtx.putImageData(imageData, 0, 0);

  const blurCanvas = new OffscreenCanvas(width, height);
  const blurCtx = blurCanvas.getContext("2d")!;
  blurCtx.filter = `blur(${spread}px)`;
  blurCtx.drawImage(maskCanvas, 0, 0);
  blurCtx.filter = "none";

  const intensity = params.halationIntensity / 100;
  ctx.globalAlpha = intensity;
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(blurCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function applyFilmTint(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  params: ProcessParams,
) {
  const film = getFilmById(params.selectedFilmId);
  const [rm, gm, bm, ra, ga, ba] = film.tint;

  if (rm === 1 && gm === 1 && bm === 1 && ra === 0 && ga === 0 && ba === 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * rm + ra);
    data[i + 1] = clamp(data[i + 1] * gm + ga);
    data[i + 2] = clamp(data[i + 2] * bm + ba);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyVignette(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  params: ProcessParams,
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);

  const inner = (1 - params.vignetteFeather / 100) * 0.6;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(inner, "transparent");
  gradient.addColorStop(1, `rgba(0,0,0,${params.vignetteIntensity / 100})`);

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}

function applyGrain(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
  grain: ImageBitmap,
  params: ProcessParams,
) {
  if (params.grainIntensity === 0) return;

  const grainCanvas = new OffscreenCanvas(width, height);
  const grainCtx = grainCanvas.getContext("2d")!;

  if (sourceWidth <= grain.width && sourceHeight <= grain.height) {
    const sx = (grain.width - sourceWidth) / 2;
    const sy = (grain.height - sourceHeight) / 2;
    grainCtx.filter = "saturate(0)";
    grainCtx.drawImage(grain, sx, sy, sourceWidth, sourceHeight, 0, 0, width, height);
    grainCtx.filter = "none";
  } else {
    const scale = Math.max(sourceWidth / grain.width, sourceHeight / grain.height);
    const dw = Math.round(grain.width * scale);
    const dh = Math.round(grain.height * scale);
    const dx = Math.round((sourceWidth - dw) / 2);
    const dy = Math.round((sourceHeight - dh) / 2);
    grainCtx.filter = "saturate(0)";
    grainCtx.drawImage(
      grain,
      0,
      0,
      grain.width,
      grain.height,
      Math.round(dx * (width / sourceWidth)),
      Math.round(dy * (height / sourceHeight)),
      Math.round(dw * (width / sourceWidth)),
      Math.round(dh * (height / sourceHeight)),
    );
    grainCtx.filter = "none";
  }

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = params.grainIntensity / 100;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
