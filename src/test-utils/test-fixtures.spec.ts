import type { FileRecord } from "@stores/file-store-types";

import { DEFAULT_PARAMS } from "@stores/file-store-types";

export const TEST_FILE_RECORD: FileRecord = {
  id: "file-1",
  fileName: "test.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
};

export const TEST_RENDER_STATE = {
  renderUrl: null,
  isProcessing: false,
  renderError: null,
};

export const TEST_RENDER_STATE_WITH_URL = {
  renderUrl: "blob:render-url",
  isProcessing: false,
  renderError: null,
};

export const TEST_FILE_RECORD_2: FileRecord = {
  id: "file-2",
  fileName: "test2.jpg",
  sourceUrl: "blob:preview-url-2",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
};

export const TEST_FILE_RECORD_PHOTO: FileRecord = {
  id: "file-1",
  fileName: "photo.jpg",
  sourceUrl: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
};
