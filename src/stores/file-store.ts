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
  setRenderResult: (id: string, renderUrl: string | null, renderError: string | null) => void;
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
  setRenderResult: (id, renderUrl, renderError) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, renderUrl, renderError, isProcessing: false } : f,
      ),
    })),
}));
