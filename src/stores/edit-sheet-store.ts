import { create } from "zustand";

type EditSheetStore = {
  openSheetId: string | null;
  showOriginal: Record<string, boolean>;
  previewUrl: string | null;
  setOpenSheetId: (id: string | null) => void;
  setShowOriginal: (id: string, value: boolean) => void;
  setPreviewUrl: (url: string | null) => void;
};

export const useEditSheetStore = create<EditSheetStore>((set) => ({
  openSheetId: null,
  showOriginal: {},
  previewUrl: null,
  setOpenSheetId: (openSheetId) => set({ openSheetId }),
  setShowOriginal: (id, value) =>
    set((state) => ({
      showOriginal: { ...state.showOriginal, [id]: value },
    })),
  setPreviewUrl: (url) =>
    set((state) => {
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      return { previewUrl: url };
    }),
}));
