export const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? "/";
export const FEATURE_3D_PHOTO = import.meta.env.VITE_FEATURE_3D_PHOTO === "true";

export const FILE_SIZE_LIMIT_BYTES =
  (Number(import.meta.env.VITE_FILE_SIZE_LIMIT_MB) || 30) * 1024 * 1024;
