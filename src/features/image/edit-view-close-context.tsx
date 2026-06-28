import { createContext, use } from "react";

const EditViewCloseContext = createContext<(() => void) | null>(null);

export function EditViewCloseProvider({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return <EditViewCloseContext.Provider value={onClose}>{children}</EditViewCloseContext.Provider>;
}

export function useEditViewClose(): () => void {
  const ctx = use(EditViewCloseContext);
  if (!ctx) throw new Error("useEditViewClose must be used within EditViewCloseProvider");
  return ctx;
}
