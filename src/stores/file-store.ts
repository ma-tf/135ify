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
  setFiles: (files: FileWithPreview[]) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  setFiles: (files) => set({ files }),
}));
