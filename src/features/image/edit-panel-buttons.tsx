import type { ProcessParams } from "@stores/file-store-types";

import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { SaveToGalleryButton } from "@features/image/save-to-gallery-button";
import { useFile } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { DownloadIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";

export function EditPanelButtons({
  setParam,
  downloadFullSize,
  showOriginal,
  setShowOriginal,
}: {
  setParam: (partial: Partial<ProcessParams>) => void;
  downloadFullSize: (showOriginal: boolean) => Promise<void>;
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
}) {
  const file = useFile();
  const { removeFile } = useStorage();
  const onClose = useEditViewClose();

  const handleReset = () => {
    setParam(DEFAULT_PARAMS);
    setShowOriginal(false);
  };

  const handleDelete = () => {
    removeFile(file.id);
    onClose();
  };

  const handleDownload = async () => {
    await downloadFullSize(showOriginal);
  };

  return (
    <div className="flex flex-col gap-2">
      <SaveToGalleryButton />
      <Button
        disabled={file.isProcessing}
        size="sm"
        className="gap-1.5 shadow-xs"
        onClick={handleDownload}
      >
        {file.isProcessing ? (
          <Spinner className="size-3.5" />
        ) : (
          <DownloadIcon className="size-3.5" />
        )}
        Download
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 shadow-xs" onClick={handleReset}>
        <RotateCcwIcon className="size-3.5" />
        Reset
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5 border-0 shadow-xs"
        onClick={handleDelete}
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>
    </div>
  );
}
