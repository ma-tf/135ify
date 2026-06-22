import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { formatBytes } from "@lib/utils";
import { create } from "zustand";

import { DEFAULT_PARAMS, type FileWithState, type ProcessParams } from "./file-store-types";

let nextId = 0;

export function prepareFiles(files: File[]): { valid: FileWithState[]; errors: string[] } {
  const valid: FileWithState[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      errors.push(
        `File "${file.name}" exceeds the maximum size of ${formatBytes(FILE_SIZE_LIMIT_BYTES)}.`,
      );
      continue;
    }

    if (!file.type.startsWith("image/")) {
      errors.push(`File "${file.name}" is not an accepted file type.`);
      continue;
    }

    valid.push({
      file,
      id: `${file.name}-${++nextId}`,
      preview: URL.createObjectURL(file),
      params: { ...DEFAULT_PARAMS },
      renderUrl: null,
      isProcessing: false,
      renderError: null,
    });
  }

  return { valid, errors };
}

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
