import { processImage, getGrainBitmap } from "@features/process/process-image";
import { useDebouncedCallback } from "@hooks/use-debounced-callback";
import { useFileStore } from "@stores/file-store";
import { useParameterStore } from "@stores/parameter-store";
import { useRenderStore } from "@stores/render-store";
import { useCallback } from "react";

export function useProcessImage() {
  const setRenderUrl = useRenderStore((s) => s.setRenderUrl);
  const setRenderError = useRenderStore((s) => s.setRenderError);
  const setIsProcessing = useRenderStore((s) => s.setIsProcessing);

  const run = useCallback(
    async (maxDimension?: number) => {
      const params = useParameterStore.getState();
      const { files, activeFileId } = useFileStore.getState();
      const file = files.find((f) => f.id === activeFileId) ?? files.at(-1);
      if (!file?.preview) return;

      setIsProcessing(true);
      setRenderError(null);

      try {
        const res = await fetch(file.preview);
        const blob = await res.blob();
        const source = await createImageBitmap(blob);
        const grain = await getGrainBitmap();
        const resultBlob = await processImage(source, grain, params, {
          maxDimension,
        });
        source.close();

        const url = URL.createObjectURL(resultBlob);

        const currentState = useRenderStore.getState();
        if (currentState.renderUrl) {
          URL.revokeObjectURL(currentState.renderUrl);
        }

        setRenderUrl(url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [setRenderUrl, setRenderError, setIsProcessing],
  );

  const processPreview = useCallback(() => run(1200), [run]);

  const processDownload = useCallback(async () => {
    const { files, activeFileId } = useFileStore.getState();
    const file = files.find((f) => f.id === activeFileId) ?? files.at(-1);
    if (!file?.preview) return;

    await run();

    const renderState = useRenderStore.getState();
    if (renderState.renderUrl && !renderState.renderError) {
      const fileName = file.file instanceof File ? file.file.name : file.file.name;
      const downloadName = fileName.replace(/\.[^.]+$/, "") + ".jpg";

      const a = document.createElement("a");
      a.href = renderState.renderUrl;
      a.download = downloadName;
      a.click();
    }
  }, [run]);

  const { debounced: processPreviewDebounced, flush: processPreviewFlush } = useDebouncedCallback(
    processPreview,
    50,
  );

  return { processPreviewDebounced, processPreviewFlush, processDownload };
}
