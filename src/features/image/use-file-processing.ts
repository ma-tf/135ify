import type { ProcessParams } from "@stores/file-store-types";

import { processToBlobUrl } from "@features/process/process-image";
import { useDebounce } from "@hooks/use-debounce";
import { useFile } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { useCallback } from "react";

export function useFileProcessing() {
  const file = useFile();
  const { updateParams, setRenderUrl, setProcessing, setRenderError } = useStorage();

  const process = useCallback(
    async (params: ProcessParams) => {
      setProcessing(file.id, true);
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      setRenderUrl(file.id, null);
      setRenderError(file.id, null);

      try {
        const url = await processToBlobUrl(file.sourceUrl, params);
        setRenderUrl(file.id, url);
      } catch (err) {
        console.error("Image processing failed:", err);
        const msg = err instanceof Error ? err.message : "Processing failed";
        setRenderError(file.id, msg);
      }
      setProcessing(file.id, false);
    },
    [file.id, file.sourceUrl, file.renderUrl, setRenderUrl, setProcessing, setRenderError],
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
