import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { createContext, useContext } from "react";

export interface StorageContextValue {
  files: FileRecord[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateParams: (id: string, params: Partial<ProcessParams>) => void;
  setRenderUrl: (id: string, renderUrl: string | null) => void;
  setProcessing: (id: string, isProcessing: boolean) => void;
  setRenderError: (id: string, renderError: string | null) => void;
  loading: boolean;
  error: Error | null;
}

export const StorageContext = createContext<StorageContextValue | null>(null);

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
}
