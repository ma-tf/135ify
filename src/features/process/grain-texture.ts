let grainBitmapPromise: Promise<ImageBitmap> | null = null;

export function getGrainBitmap(grainUrl: string): Promise<ImageBitmap> {
  if (!grainBitmapPromise) {
    grainBitmapPromise = (async () => {
      const res = await fetch(grainUrl);
      const blob = await res.blob();
      return createImageBitmap(blob);
    })();
  }
  return grainBitmapPromise;
}
