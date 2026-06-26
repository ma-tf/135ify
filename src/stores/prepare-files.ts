import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { formatBytes } from "@lib/utils";
import { DEFAULT_PARAMS, type FileRecord } from "@stores/file-store-types";

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
      createdAt: Date.now(),
      renderUrl: null,
      isProcessing: false,
      renderError: null,
    });
  }

  return { valid, records, errors };
}
