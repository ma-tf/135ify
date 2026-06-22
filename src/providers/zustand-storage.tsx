import { StorageContext } from "@providers/storage-context";
import { prepareFiles, useFileStore } from "@stores/file-store";
import { type ReactNode, useCallback, useMemo } from "react";

export function ZustandStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);
  const storeAddFiles = useFileStore((s) => s.addFiles);
  const removeFile = useFileStore((s) => s.removeFile);
  const updateParams = useFileStore((s) => s.updateParams);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const { records } = prepareFiles(newFiles);
      if (records.length === 0) return;
      storeAddFiles(records);
    },
    [storeAddFiles],
  );

  const value = useMemo(
    () => ({ files, addFiles, removeFile, updateParams }),
    [files, addFiles, removeFile, updateParams],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
