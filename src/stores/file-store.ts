import type { FilmId } from "@features/process/films";

import { DEFAULT_FILM_ID } from "@features/process/films";
import { create } from "zustand";

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
};

export interface FileParams {
  selectedFilmId: FilmId;
  halationIntensity: number;
  halationSpread: number;
  halationThreshold: number;
  vignetteIntensity: number;
  vignetteFeather: number;
  grainIntensity: number;
}

export const DEFAULT_PARAMS: FileParams = {
  selectedFilmId: DEFAULT_FILM_ID,
  halationIntensity: 0,
  halationSpread: 0,
  halationThreshold: 0,
  vignetteIntensity: 0,
  vignetteFeather: 0,
  grainIntensity: 0,
};

export type FileWithState = {
  file: File | FileMetadata;
  id: string;
  preview: string;
  params: FileParams;
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
  updateFileParams: (id: string, params: Partial<FileParams>) => void;
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
  updateFileParams: (id, params) =>
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
