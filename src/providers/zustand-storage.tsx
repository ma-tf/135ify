import type { FileWithState } from "@stores/file-store";

import { StorageContext } from "@providers/storage-context";
import { useFileStore } from "@stores/file-store";
import { type ReactNode, useCallback, useMemo } from "react";

export function ZustandStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);
  const setStoreFiles = useFileStore((s) => s.setFiles);

  const setFiles = useCallback((files: FileWithState[]) => setStoreFiles(files), [setStoreFiles]);
  const value = useMemo(() => ({ files, setFiles }), [files, setFiles]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
