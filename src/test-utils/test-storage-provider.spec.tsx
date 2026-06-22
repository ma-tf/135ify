import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { type ReactNode, useMemo } from "react";

export function TestStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);

  const value = useMemo(
    () => ({
      files,
      addFiles: (newFiles: File[]) => {
        const records: FileRecord[] = newFiles.map((f) => ({
          id: `${f.name}-${Date.now()}`,
          fileName: f.name,
          sourceUrl: URL.createObjectURL(f),
          params: { ...DEFAULT_PARAMS },
        }));
        useFileStore.setState((s) => ({ files: [...records, ...s.files] }));
      },
      removeFile: (id: string) => {
        const file = useFileStore.getState().files.find((f) => f.id === id);
        if (file) {
          URL.revokeObjectURL(file.sourceUrl);
        }
        useFileStore.setState((s) => ({ files: s.files.filter((f) => f.id !== id) }));
      },
      updateParams: (id: string, params: Partial<ProcessParams>) => {
        useFileStore.setState((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, params: { ...f.params, ...params } } : f,
          ),
        }));
      },
    }),
    [files],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
