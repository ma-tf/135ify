import { processImage, getGrainBitmap, type ProcessParams } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useFileStore } from "@stores/file-store";
import { useParameterStore } from "@stores/parameter-store";
import { useRenderStore } from "@stores/render-store";
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

async function processFile(maxDimension?: number): Promise<string> {
  const params = useParameterStore.getState();
  const { files, activeFileId } = useFileStore.getState();
  const file = files.find((f) => f.id === activeFileId) ?? files.at(-1);
  if (!file?.preview) throw new Error("No file to process");
  const grain = await getGrainBitmap();
  return processFileToUrl(file.preview, grain, params, maxDimension);
}

export function useProcessImage() {
  const setRenderUrl = useRenderStore((s) => s.setRenderUrl);
  const setRenderError = useRenderStore((s) => s.setRenderError);
  const setIsProcessing = useRenderStore((s) => s.setIsProcessing);

  const process = useCallback(
    async (maxDimension?: number) => {
      setIsProcessing(true);
      setRenderError(null);

      try {
        const url = await processFile(maxDimension);

        const prevUrl = useRenderStore.getState().renderUrl;
        if (prevUrl) URL.revokeObjectURL(prevUrl);

        setRenderUrl(url);
        setIsProcessing(false);
        return url;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderError(msg);
        setIsProcessing(false);
      }
    },
    [setRenderUrl, setRenderError, setIsProcessing],
  );

  const processPreview = useCallback(() => process(1200), [process]);

  const getFullSizeUrl = useCallback(async () => {
    try {
      return await processFile();
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const { debounced: processPreviewDebounced, flush: processPreviewFlush } = useDebouncedCallback(
    processPreview,
    50,
  );

  return { processPreviewDebounced, processPreviewFlush, getFullSizeUrl };
}
