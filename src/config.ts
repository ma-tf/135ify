export const BASE_PATH = import.meta.env.VITE_BASE_PATH ?? "/";
export const FEATURE_3D_PHOTO = import.meta.env.VITE_FEATURE_3D_PHOTO === "true";
export const FEATURE_SIGN_IN = import.meta.env.VITE_FEATURE_SIGN_IN === "true";
export const GRAIN_URL = `${import.meta.env.BASE_URL}grain.jpg`;
export const FILE_SIZE_LIMIT_BYTES =
  (Number(import.meta.env.VITE_FILE_SIZE_LIMIT_MB) || 5) * 1024 * 1024;
