import type { ProcessParams } from "@stores/file-store-types";

import { getFilmById } from "@features/process/film";
import { clamp } from "@lib/utils";

export function applyFilmTint(
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
    data[i] = clamp(data[i] * rm + ra, 0, 255);
    data[i + 1] = clamp(data[i + 1] * gm + ga, 0, 255);
    data[i + 2] = clamp(data[i + 2] * bm + ba, 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);
}
