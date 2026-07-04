import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AiProviderState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useAiProviderStore = create<AiProviderState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
    }),
    { name: "ai-provider-key" },
  ),
);
