import { GRAIN_URL } from "@config";

let grainBitmapPromise: Promise<ImageBitmap> | null = null;

export function getGrainBitmap(): Promise<ImageBitmap> {
  if (!grainBitmapPromise) {
    grainBitmapPromise = (async () => {
      const res = await fetch(GRAIN_URL);
      const blob = await res.blob();
      return createImageBitmap(blob);
    })();
  }
  return grainBitmapPromise;
}
