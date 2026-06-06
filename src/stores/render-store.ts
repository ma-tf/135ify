import { create } from "zustand";

interface RenderStore {
  renderUrl: string | null;
  setRenderUrl: (url: string | null) => void;
  renderError: string | null;
  setRenderError: (error: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const useRenderStore = create<RenderStore>((set) => ({
  renderUrl: null,
  setRenderUrl: (renderUrl) => set({ renderUrl }),
  renderError: null,
  setRenderError: (renderError) => set({ renderError }),
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),
}));
