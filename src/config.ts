export const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? "";
export const FEATURE_AI_GRAIN = import.meta.env.VITE_FEATURE_AI_GRAIN === "true";
export const FEATURE_SIGN_IN = import.meta.env.VITE_FEATURE_SIGN_IN === "true";
export const GALLERY_IMAGE_LIMIT = Number(import.meta.env.VITE_GALLERY_IMAGE_LIMIT) || 10;
export const FILE_SIZE_LIMIT_BYTES =
  (Number(import.meta.env.VITE_FILE_SIZE_LIMIT_MB) || 5) * 1024 * 1024;
export const GRAIN_URL = `${import.meta.env.BASE_URL}grain.jpg`;
