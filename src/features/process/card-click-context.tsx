import { createContext, use } from "react";

type CardClickContextValue = (fileId: string) => void;

const CardClickContext = createContext<CardClickContextValue | null>(null);

export function CardClickProvider({
  onCardClick,
  children,
}: {
  onCardClick: (fileId: string) => void;
  children: React.ReactNode;
}) {
  return <CardClickContext.Provider value={onCardClick}>{children}</CardClickContext.Provider>;
}

export function useCardClick(): CardClickContextValue {
  const ctx = use(CardClickContext);
  if (!ctx) throw new Error("useCardClick must be used within CardClickProvider");
  return ctx;
}
