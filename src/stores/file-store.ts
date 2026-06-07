import { create } from "zustand";

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
};

export type FileWithPreview = {
  file: File | FileMetadata;
  id: string;
  preview: string;
};

interface FileStore {
  files: FileWithPreview[];
  activeFileId: string | null;
  setFiles: (files: FileWithPreview[]) => void;
  setActiveFileId: (id: string | null) => void;
  removeFile: (id: string) => void;
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
}));
