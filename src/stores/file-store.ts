import type { ProcessParams } from "@features/process/process-image";

import { create } from "zustand";

export type FileWithState = {
  file: File;
  id: string;
  preview: string;
  params: ProcessParams;
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
};

interface FileStore {
  files: FileWithState[];
  setFiles: (files: FileWithState[]) => void;
  updateProcessParams: (id: string, params: Partial<ProcessParams>) => void;
  revokeFileUrls: (id: string) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
  updateProcessParams: (id, params) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, params: { ...f.params, ...params } } : f,
      ),
    })),
  revokeFileUrls: (id) =>
    set((state) => {
      const file = state.files.find((f) => f.id === id);
      if (!file) return state;
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      return state;
    }),
}));
