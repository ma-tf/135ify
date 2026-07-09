import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    GALLERY_IMAGE_LIMIT: v.optional(v.string()),
    FILE_SIZE_LIMIT_BYTES: v.optional(v.string()),
    GALLERY_STORAGE_LIMIT_BYTES: v.optional(v.string()),
  },
});

export default app;
