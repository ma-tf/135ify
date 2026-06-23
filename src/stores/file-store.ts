import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { formatBytes } from "@lib/utils";
import { create } from "zustand";

import { DEFAULT_PARAMS, type FileRecord, type ProcessParams } from "./file-store-types";

let nextId = 0;

export function prepareFiles(files: File[]) {
  const valid: File[] = [];
  const records: FileRecord[] = [];
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

    valid.push(file);
    records.push({
      id: `${file.name}-${++nextId}`,
      fileName: file.name,
      sourceUrl: URL.createObjectURL(file),
      params: { ...DEFAULT_PARAMS },
    });
  }

  return { valid, records, errors };
}

interface FileStore {
  files: FileRecord[];
  addFiles: (records: FileRecord[]) => void;
  updateParams: (id: string, params: Partial<ProcessParams>) => void;
  removeFile: (id: string) => void;
}

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
      return { files: state.files.filter((f) => f.id !== id) };
    }),
}));
