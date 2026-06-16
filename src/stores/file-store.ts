import type { ProcessParams } from "@features/process/process-image";

import { create } from "zustand";

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
};

export type FileWithState = {
  file: File | FileMetadata;
  id: string;
  preview: string;
  params: ProcessParams;
  renderUrl: string | null;
  isProcessing: boolean;
  renderError: string | null;
};

interface FileStore {
  files: FileWithState[];
  activeFileId: string | null;
  setFiles: (files: FileWithState[]) => void;
  setActiveFileId: (id: string | null) => void;
  removeFile: (id: string) => void;
  updateProcessParams: (id: string, params: Partial<ProcessParams>) => void;
  setRenderResult: (id: string, renderUrl: string | null, renderError: string | null) => void;
  setProcessing: (id: string, isProcessing: boolean) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  activeFileId: null,
  setFiles: (files) => set({ files }),
  setActiveFileId: (activeFileId) => set({ activeFileId }),
  removeFile: (id) =>
    set((state) => {
      const newFiles = state.files.filter((f) => f.id !== id);
      const activeFileId =
        state.activeFileId === id ? (newFiles.at(-1)?.id ?? null) : state.activeFileId;
      return { files: newFiles, activeFileId };
    }),
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
  setProcessing: (id, isProcessing) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, isProcessing } : f)),
    })),
}));
