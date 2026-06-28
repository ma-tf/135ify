import { useCallback } from "react";

export function useGalleryAddFiles() {
  const addFiles = useCallback(() => {
    console.warn("GalleryStorageAdapter does not support adding files");
  }, []);

  return { addFiles };
}
