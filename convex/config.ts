import { env } from "./_generated/server";

export const GALLERY_IMAGE_LIMIT = Number(env.GALLERY_IMAGE_LIMIT) || 10;
export const FILE_SIZE_LIMIT_BYTES = Number(env.FILE_SIZE_LIMIT_BYTES) || 5 * 1024 * 1024;
export const GALLERY_STORAGE_LIMIT_BYTES =
  Number(env.GALLERY_STORAGE_LIMIT_BYTES) || GALLERY_IMAGE_LIMIT * FILE_SIZE_LIMIT_BYTES;
