import type { FileRecord, ProcessParams } from "@stores/file-store-types";

import { create } from "zustand";

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
}

export const useGalleryClientStore = create<GalleryClientState>((set) => ({
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
}));
