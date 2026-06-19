import { create } from "zustand";

type EditSheetStore = {
  openSheetId: string | null;
  imageSrc: string;
  showOriginal: Record<string, boolean>;
  inspectUrl: string | null;
  setOpenSheetId: (id: string | null) => void;
  setImageSrc: (url: string) => void;
  setShowOriginal: (id: string, value: boolean) => void;
  setInspectUrl: (url: string | null) => void;
};

export const useEditSheetStore = create<EditSheetStore>((set) => ({
  openSheetId: null,
  imageSrc: "",
  showOriginal: {},
  inspectUrl: null,
  setOpenSheetId: (openSheetId) => set({ openSheetId }),
  setImageSrc: (imageSrc) => set({ imageSrc }),
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
