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
    set((state) => {
      const file = state.files.find((f) => f.id === id);
      if (!file) return state;
      URL.revokeObjectURL(file.sourceUrl);
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      return { files: state.files.filter((f) => f.id !== id) };
    }),
  setRenderUrl: (id, renderUrl) =>
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        if (renderUrl !== undefined && f.renderUrl && renderUrl !== f.renderUrl) {
          URL.revokeObjectURL(f.renderUrl);
        }
        return { ...f, renderUrl };
      }),
    })),
  setProcessing: (id, isProcessing) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, isProcessing } : f)),
    })),
  setRenderError: (id, renderError) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, renderError } : f)),
    })),
}));
