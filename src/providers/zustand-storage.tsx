import type { FileWithState } from "@stores/file-store-types";

import { StorageContext } from "@providers/storage-context";
import { prepareFiles, useFileStore } from "@stores/file-store";
import { type ReactNode, useCallback, useMemo } from "react";

export function ZustandStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);

  const addFiles = useCallback((newFiles: File[]) => {
    const { valid } = prepareFiles(newFiles);
    if (valid.length === 0) return;
    useFileStore.setState((s) => ({ files: [...valid, ...s.files] }));
  }, []);

  const removeFile = useCallback((id: string) => {
    const file = useFileStore.getState().files.find((f) => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.preview);
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
    }
    useFileStore.setState((s) => ({ files: s.files.filter((f) => f.id !== id) }));
  }, []);

  const updateFile = useCallback((id: string, changes: Partial<FileWithState>) => {
    useFileStore.setState((s) => ({
      files: s.files.map((f) => {
        if (f.id !== id) return f;
        if (changes.renderUrl !== undefined && f.renderUrl) URL.revokeObjectURL(f.renderUrl);
        return { ...f, ...changes };
      }),
    }));
  }, []);

  const value = useMemo(
    () => ({ files, addFiles, removeFile, updateFile }),
    [files, addFiles, removeFile, updateFile],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
