import { useFileStore } from "@stores/file-store";
import { useCallback, useState } from "react";

export function useEditActions(fileId: string) {
  const [open, setOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewUrl, setPreviewUrlState] = useState<string | null>(null);

  const setPreviewUrl = useCallback((url: string | null) => {
    setPreviewUrlState((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const handleRemove = useCallback(() => {
    const file = useFileStore.getState().files.find((f) => f.id === fileId);
    if (!file) return;
    if (file.file instanceof File) URL.revokeObjectURL(file.preview);
    if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
    useFileStore.getState().removeFile(fileId);
  }, [fileId]);

  return {
    open,
    setOpen,
    showOriginal,
    setShowOriginal,
    previewUrl,
    setPreviewUrl,
    handleRemove,
  };
}
