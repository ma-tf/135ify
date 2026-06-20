import type { FileWithState } from "@stores/file-store";

import { DEFAULT_PARAMS } from "@features/process/process-image";

export const TEST_FILE: FileWithState = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

export const TEST_FILE_WITH_RENDER: FileWithState = {
  ...TEST_FILE,
  id: "file-2",
  renderUrl: "blob:render-url",
};

export const TEST_FILE_2: FileWithState = {
  ...TEST_FILE,
  id: "file-2",
  file: new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
  preview: "blob:preview-url-2",
};

export const TEST_FILE_PHOTO: FileWithState = {
  file: new File(["test"], "photo.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  renderUrl: "blob:render-url",
  isProcessing: false,
  renderError: null,
};
