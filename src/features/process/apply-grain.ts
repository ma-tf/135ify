import type { ProcessParams } from "@stores/file-store-types";

export function applyGrain(
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
