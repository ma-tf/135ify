import type { FileWithState } from "@stores/file-store";

import { createContext, useContext } from "react";

export interface StorageContextValue {
  files: FileWithState[];
  setFiles: (files: FileWithState[]) => void;
}

export const StorageContext = createContext<StorageContextValue | null>(null);

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
}
