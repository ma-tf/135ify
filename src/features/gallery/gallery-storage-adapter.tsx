import { useGalleryAddFiles } from "@features/gallery/use-gallery-add-files";
import { useGalleryFiles } from "@features/gallery/use-gallery-files";
import { useGalleryRemoveFile } from "@features/gallery/use-gallery-remove-file";
import { useGalleryUpdateFile } from "@features/gallery/use-gallery-update-file";
import { useGalleryUpdateParams } from "@features/gallery/use-gallery-update-params";
import { EnsureProcessedOrchestrator } from "@features/image/use-ensure-processed";
import { StorageContext } from "@providers/storage-context";
import { Navigate } from "@tanstack/react-router";
import { type ReactNode, useMemo } from "react";

export function GalleryStorageAdapter({
  imageId,
  children,
}: {
  imageId: string;
  children: ReactNode;
}) {
  const { files, pendingFiles, loading, error } = useGalleryFiles(imageId);
  const { updateParams } = useGalleryUpdateParams();
  const { updateFile } = useGalleryUpdateFile();
  const { removeFile } = useGalleryRemoveFile();
  const { addFiles } = useGalleryAddFiles();

  const value = useMemo(
    () => ({
      files,
      addFiles,
      removeFile,
      updateParams,
      updateFile,
      loading,
      error,
    }),
    [files, addFiles, removeFile, updateParams, updateFile, loading, error],
  );

  if (loading) return null;
  if (error || files.length === 0) {
    return <Navigate to="/gallery" />;
  }

  return (
    <StorageContext.Provider value={value}>
      <EnsureProcessedOrchestrator pendingFiles={pendingFiles} />
      {children}
    </StorageContext.Provider>
  );
}
