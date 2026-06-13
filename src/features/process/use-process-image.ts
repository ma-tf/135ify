import { processImage, getGrainBitmap, type ProcessParams } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

async function processFileToUrl(
  previewUrl: string,
  grain: ImageBitmap,
  params: ProcessParams,
  maxDimension?: number,
): Promise<string> {
  const res = await fetch(previewUrl);
  const blob = await res.blob();
  const source = await createImageBitmap(blob);
  const resultBlob = await processImage(source, grain, params, maxDimension);
  source.close();
  return URL.createObjectURL(resultBlob);
}

async function processFile(
  previewUrl: string,
  params: ProcessParams,
  maxDimension?: number,
): Promise<string> {
  const grain = await getGrainBitmap();
  return processFileToUrl(previewUrl, grain, params, maxDimension);
}

export function useProcessImage() {
  const process = useCallback(async (fileId: string, maxDimension?: number) => {
    const store = useFileStore.getState();
    const file = store.files.find((f) => f.id === fileId);
    if (!file) return null;

    const prevUrl = file.renderUrl;
    store.setProcessing(fileId, true);
    store.setRenderResult(fileId, null, null);
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    try {
      const url = await processFile(file.preview, file.params, maxDimension);
      store.setRenderResult(fileId, url, null);
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      store.setRenderResult(fileId, null, msg);
      return null;
    }
  }, []);

  const processPreview = useCallback((fileId: string) => process(fileId, 1200), [process]);

  const getFullSizeUrl = useCallback(async (fileId: string) => {
    try {
      const { files } = useFileStore.getState();
      const file = files.find((f) => f.id === fileId);
      if (!file) return null;
      return await processFile(file.preview, file.params);
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const { debounced: processPreviewDebounced } = useDebouncedCallback(processPreview, 50);

  return { processPreviewDebounced, getFullSizeUrl };
}
