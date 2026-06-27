import type { ProcessParams } from "@stores/file-store-types";

export function applyVignette(
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
