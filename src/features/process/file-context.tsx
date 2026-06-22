import type { FileWithState } from "@stores/file-store-types";

import { useStorage } from "@providers/storage-context";
import { useRenderStateStore } from "@stores/render-state-store";
import { createContext, use } from "react";

const FileContext = createContext<FileWithState | null>(null);

export function FileProvider({ fileId, children }: { fileId: string; children: React.ReactNode }) {
  const { files } = useStorage();
  const renderState = useRenderStateStore((s) => s.get(fileId));

  const fileRecord = files.find((f) => f.id === fileId) ?? null;
  const file = fileRecord ? { ...fileRecord, ...renderState } : null;
  if (!fileRecord) throw new Error(`FileProvider: file not found for id "${fileId}"`);

  return <FileContext.Provider value={file}>{children}</FileContext.Provider>;
}

export function useFile() {
  const ctx = use(FileContext);
  if (!ctx) throw new Error("useFile must be used within FileProvider");
  return ctx;
}
