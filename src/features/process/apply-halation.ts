import type { ProcessParams } from "@stores/file-store-types";

export function applyHalation(
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
