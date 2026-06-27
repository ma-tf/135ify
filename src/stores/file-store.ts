import { type FileStore } from "@stores/file-store-types";
import { create } from "zustand";

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  addFiles: (records) => set((state) => ({ files: [...records, ...state.files] })),
  updateParams: (id, params) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, params: { ...f.params, ...params } } : f,
      ),
    })),
  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),
  setRenderUrl: (id, renderUrl) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, renderUrl } : f)),
    })),
  setProcessing: (id, isProcessing) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, isProcessing } : f)),
    })),
  setRenderError: (id, renderError) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, renderError } : f)),
    })),
  clearFiles: () => set({ files: [] }),
}));
