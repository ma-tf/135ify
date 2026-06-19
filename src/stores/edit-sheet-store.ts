import { create } from "zustand";

type EditSheetStore = {
  openSheetId: string | null;
  showOriginal: Record<string, boolean>;
  inspectUrl: string | null;
  setOpenSheetId: (id: string | null) => void;
  setShowOriginal: (id: string, value: boolean) => void;
  setInspectUrl: (url: string | null) => void;
};

export const useEditSheetStore = create<EditSheetStore>((set) => ({
  openSheetId: null,
  showOriginal: {},
  inspectUrl: null,
  setOpenSheetId: (openSheetId) => set({ openSheetId }),
  setShowOriginal: (id, value) =>
    set((state) => ({
      showOriginal: { ...state.showOriginal, [id]: value },
    })),
  setInspectUrl: (url) =>
    set((state) => {
      if (state.inspectUrl) URL.revokeObjectURL(state.inspectUrl);
      return { inspectUrl: url };
    }),
}));
