import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AiProviderState {
  apiKey: string;
  preferPlatformKey: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setPreferPlatformKey: (prefer: boolean) => void;
}

export const useAiProviderStore = create<AiProviderState>()(
  persist(
    (set) => ({
      apiKey: "",
      preferPlatformKey: true,
      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
      setPreferPlatformKey: (prefer: boolean) => set({ preferPlatformKey: prefer }),
    }),
    { name: "ai-provider-key" },
  ),
);
