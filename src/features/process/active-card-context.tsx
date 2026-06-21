import { createContext, use, useMemo, useState, type Dispatch, type SetStateAction } from "react";

type ActiveCardContextValue = {
  activeCardId: string | null;
  setActiveCardId: Dispatch<SetStateAction<string | null>>;
};

const ActiveCardContext = createContext<ActiveCardContextValue | null>(null);

export function ActiveCardProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const value = useMemo(() => ({ activeCardId, setActiveCardId }), [activeCardId, setActiveCardId]);
  return <ActiveCardContext.Provider value={value}>{children}</ActiveCardContext.Provider>;
}

export function useActiveCard() {
  const ctx = use(ActiveCardContext);
  if (!ctx) throw new Error("useActiveCard must be used within ActiveCardProvider");
  return ctx;
}
