import type { FileWithState } from "@stores/file-store";

import { useFileStore } from "@stores/file-store";
import { createContext, useContext } from "react";

const FileContext = createContext<FileWithState | null>(null);

export function FileProvider({ fileId, children }: { fileId: string; children: React.ReactNode }) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId) ?? null);
  return <FileContext.Provider value={file!}>{children}</FileContext.Provider>;
}

export function useFile() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFile must be used within FileProvider");
  return ctx;
}
