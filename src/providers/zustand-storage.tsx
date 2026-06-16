import type { FileWithState } from "@stores/file-store";

import { useFileStore } from "@stores/file-store";
import { type ReactNode, useCallback } from "react";

import { StorageContext } from "./storage-context";

export function ZustandStorageProvider({ children }: { children: ReactNode }) {
  const files = useFileStore((s) => s.files);
  const setStoreFiles = useFileStore((s) => s.setFiles);

  const setFiles = useCallback((files: FileWithState[]) => setStoreFiles(files), [setStoreFiles]);

  return <StorageContext.Provider value={{ files, setFiles }}>{children}</StorageContext.Provider>;
}
