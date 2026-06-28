import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { create } from "zustand";

interface ImageCacheEntry {
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
}

interface GalleryClientState {
  localParams: Partial<ProcessParams> | null;
  localRenderUrl: string | null;
  localIsProcessing: boolean;
  localRenderError: string | null;
  mergeParamsWithSnapshot: (params: Partial<ProcessParams>) => Partial<ProcessParams> | null;
  replaceParams: (params: Partial<ProcessParams> | null) => void;
  setRenderState: (
    update: Partial<Pick<FileRecord, "renderUrl" | "isProcessing" | "renderError">>,
  ) => void;
  clear: () => void;
  imageCache: Record<string, ImageCacheEntry>;
  getImageCacheEntry: (id: string) => ImageCacheEntry | undefined;
  setImageCacheEntry: (id: string, update: Partial<ImageCacheEntry>) => void;
}

export const useGalleryClientStore = create<GalleryClientState>((set, get) => ({
  localParams: null,
  localRenderUrl: null,
  localIsProcessing: false,
  localRenderError: null,
  mergeParamsWithSnapshot: (params) => {
    let snapshot: Partial<ProcessParams> | null = null;
    set((state) => {
      snapshot = state.localParams;
      return { localParams: { ...state.localParams, ...params } };
    });
    return snapshot;
  },
  replaceParams: (params) => set({ localParams: params }),
  setRenderState: (update) =>
    set(() => {
      const next: Partial<GalleryClientState> = {};
      if ("renderUrl" in update) next.localRenderUrl = update.renderUrl;
      if ("isProcessing" in update) next.localIsProcessing = update.isProcessing;
      if ("renderError" in update) next.localRenderError = update.renderError;
      return next;
    }),
  clear: () =>
    set({
      localParams: null,
      localRenderUrl: null,
      localIsProcessing: false,
      localRenderError: null,
    }),
  imageCache: {},
  getImageCacheEntry: (id) => get().imageCache[id],
  setImageCacheEntry: (id, update) =>
    set((state) => ({
      imageCache: {
        ...state.imageCache,
        [id]: { ...state.imageCache[id], ...update },
      },
    })),
}));
