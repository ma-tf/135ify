import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

type ActiveCardContextValue = {
  activeCardId: string | null;
  setActiveCardId: Dispatch<SetStateAction<string | null>>;
};

const ActiveCardContext = createContext<ActiveCardContextValue | null>(null);

export function ActiveCardProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  return (
    <ActiveCardContext.Provider value={{ activeCardId, setActiveCardId }}>
      {children}
    </ActiveCardContext.Provider>
  );
}

export function useActiveCard() {
  const ctx = useContext(ActiveCardContext);
  if (!ctx) throw new Error("useActiveCard must be used within ActiveCardProvider");
  return ctx;
}
