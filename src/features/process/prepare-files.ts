import type { FileWithState } from "@stores/file-store";

import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { DEFAULT_PARAMS } from "@features/process/process-image";
import { formatBytes } from "@lib/utils";

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
