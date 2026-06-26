import type { FileWithState } from "@stores/file-store-types";

import { useStorage } from "@providers/storage-context";
import { createContext, use } from "react";

const FileContext = createContext<FileWithState | null>(null);

export function FileProvider({ fileId, children }: { fileId: string; children: React.ReactNode }) {
  const { files } = useStorage();

  const file = files.find((f) => f.id === fileId) ?? null;
  if (!file) throw new Error(`FileProvider: file not found for id "${fileId}"`);

  return <FileContext.Provider value={file}>{children}</FileContext.Provider>;
}

export function useFile() {
  const ctx = use(FileContext);
  if (!ctx) throw new Error("useFile must be used within FileProvider");
  return ctx;
}
