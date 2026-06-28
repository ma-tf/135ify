import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebounce } from "@hooks/use-debounce";
import { useFile } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { useCallback } from "react";

export function useFileProcessing() {
  const file = useFile();
  const { updateParams, updateFile } = useStorage();

  const process = useCallback(
    async (params: ProcessParams) => {
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      updateFile(file.id, { isProcessing: true, renderUrl: null, renderError: null });

      try {
        const url = await processToBlobUrl(file.sourceUrl, params);
        updateFile(file.id, { renderUrl: url, isProcessing: false });
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        updateFile(file.id, { renderError: msg, isProcessing: false });
      }
    },
    [file.id, file.sourceUrl, file.renderUrl, updateFile],
  );

  const { debounced: saveAndProcess } = useDebounce((params: ProcessParams) => {
    updateParams(file.id, params);
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
