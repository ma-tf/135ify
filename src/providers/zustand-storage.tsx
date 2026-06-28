import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { prepareFiles } from "@stores/prepare-files";
import { type ReactNode, useCallback, useMemo } from "react";

export function ZustandStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);
  const storeAddFiles = useFileStore((s) => s.addFiles);
  const storeRemoveFile = useFileStore((s) => s.removeFile);
  const storeSetRenderUrl = useFileStore((s) => s.setRenderUrl);
  const storeSetProcessing = useFileStore((s) => s.setProcessing);
  const storeSetRenderError = useFileStore((s) => s.setRenderError);

  const removeFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.sourceUrl);
        if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      }
      storeRemoveFile(id);
    },
    [files, storeRemoveFile],
  );
  const updateParams = useFileStore((s) => s.updateParams);
  const setRenderUrl = storeSetRenderUrl;
  const setProcessing = storeSetProcessing;
  const setRenderError = storeSetRenderError;

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const { records } = prepareFiles(newFiles);
      if (records.length === 0) return;
      storeAddFiles(records);
    },
    [storeAddFiles],
  );

  const pendingFiles = useMemo(() => files.filter((f) => !f.renderUrl && !f.isProcessing), [files]);

  const value = useMemo(
    () => ({
      files,
      addFiles,
      removeFile,
      updateParams,
      setRenderUrl,
      setProcessing,
      setRenderError,
      loading: false,
      error: null,
    }),
    [files, addFiles, removeFile, updateParams, setRenderUrl, setProcessing, setRenderError],
  );

  return (
    <StorageContext.Provider value={value}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      {children}
    </StorageContext.Provider>
  );
}
