import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AiProviderState {
  apiKey: string;
  preferUserKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setPreferUserKey: (prefer: boolean) => void;
}

export const useAiProviderStore = create<AiProviderState>()(
  persist(
    (set) => ({
      apiKey: "",
      preferUserKey: false,
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
      setPreferUserKey: (prefer: boolean) => set({ preferUserKey: prefer }),
    }),
    { name: "ai-provider-key" },
  ),
);
