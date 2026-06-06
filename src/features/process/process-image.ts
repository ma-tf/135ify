export interface ProcessParams {
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
}

export interface ProcessOptions {
  maxDimension?: number;
}

let grainBitmapPromise: Promise<ImageBitmap> | null = null;

export function getGrainBitmap(): Promise<ImageBitmap> {
  if (!grainBitmapPromise) {
    grainBitmapPromise = (async () => {
      const res = await fetch("/grain.jpg");
      const blob = await res.blob();
      return createImageBitmap(blob);
    })();
  }
  return grainBitmapPromise;
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

export async function processImage(
  source: ImageBitmap,
  grain: ImageBitmap,
  params: ProcessParams,
  options?: ProcessOptions,
): Promise<Blob> {
  const { width, height } = constrainDimensions(source.width, source.height, options?.maxDimension);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(source, 0, 0, width, height);

  applyVignette(ctx, width, height, params);
  applyGrain(ctx, width, height, grain, params);

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
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
  grain: ImageBitmap,
  params: ProcessParams,
) {
  if (params.grainIntensity === 0) return;

  const grainCanvas = new OffscreenCanvas(width, height);
  const grainCtx = grainCanvas.getContext("2d")!;

  if (width <= grain.width && height <= grain.height) {
    const sx = (grain.width - width) / 2;
    const sy = (grain.height - height) / 2;
    grainCtx.filter = "saturate(0)";
    grainCtx.drawImage(grain, sx, sy, width, height, 0, 0, width, height);
    grainCtx.filter = "none";
  } else {
    const scale = Math.max(width / grain.width, height / grain.height);
    const dw = Math.round(grain.width * scale);
    const dh = Math.round(grain.height * scale);
    const dx = Math.round((width - dw) / 2);
    const dy = Math.round((height - dh) / 2);
    grainCtx.filter = "saturate(0)";
    grainCtx.drawImage(grain, 0, 0, grain.width, grain.height, dx, dy, dw, dh);
    grainCtx.filter = "none";
  }

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = params.grainIntensity / 100;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
