import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebounce } from "@hooks/use-debounce";
import { useStorage } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { useCallback } from "react";

export function useFileProcessing(fileId: string) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const { updateParams } = useStorage();
  const setRenderUrl = useFileStore((s) => s.setRenderUrl);
  const setProcessing = useFileStore((s) => s.setProcessing);
  const setRenderError = useFileStore((s) => s.setRenderError);

  if (!file) throw new Error(`File not found: ${fileId}`);

  const process = useCallback(
    async (params: ProcessParams) => {
      setProcessing(fileId, true);
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      setRenderUrl(fileId, null);
      setRenderError(fileId, null);

      try {
        const url = await processToBlobUrl(file.sourceUrl, params);
        setRenderUrl(fileId, url);
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderError(fileId, msg);
      }
      setProcessing(fileId, false);
    },
    [fileId, file.sourceUrl, file.renderUrl, setRenderUrl, setProcessing, setRenderError],
  );

  const { debounced: saveAndProcess } = useDebounce((params: ProcessParams) => {
    updateParams(fileId, params);
    void process(params);
  }, 200);

  const setParam = useCallback(
    (partial: Partial<ProcessParams>) => {
      const merged = { ...file.params, ...partial };
      saveAndProcess(merged);
    },
    [file.params, saveAndProcess],
  );

  const downloadFullSize = useCallback(async () => {
    const url = await processToBlobUrl(file.sourceUrl, file.params);
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName.replace(/\.[^.]+$/, "") + ".jpg";
    a.click();
    URL.revokeObjectURL(url);
  }, [file.sourceUrl, file.params, file.fileName]);

  return { params: file.params, setParam, downloadFullSize };
}
