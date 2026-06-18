import { createContext, useContext } from "react";

const FileContext = createContext<string | null>(null);

export function FileProvider({ fileId, children }: { fileId: string; children: React.ReactNode }) {
  return <FileContext.Provider value={fileId}>{children}</FileContext.Provider>;
}

export function useFileId() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFileId must be used within FileProvider");
  return ctx;
}
