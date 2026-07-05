import type { ProcessParams } from "@stores/file-store-types";

import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { GenerateAiGrainButton } from "@features/image/generate-ai-grain-button";
import { SaveToGalleryButton } from "@features/image/save-to-gallery-button";
import { useFile } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { DownloadIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";

export function EditPanelButtons({
  context,
  setParam,
  downloadFullSize,
}: {
  context: "upload" | "gallery";
  setParam: (partial: Partial<ProcessParams>) => void;
  downloadFullSize: () => Promise<void>;
}) {
  const file = useFile();
  const { removeFile } = useStorage();
  const onClose = useEditViewClose();

  const handleReset = () => {
    setParam(DEFAULT_PARAMS);
  };

  const handleDelete = () => {
    removeFile(file.id);
    onClose();
  };

  const handleDownload = async () => {
    await downloadFullSize();
  };

  return (
    <div className="flex flex-col gap-2">
      {context === "upload" && <SaveToGalleryButton />}
      {context === "gallery" && <GenerateAiGrainButton />}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
        <RotateCcwIcon className="size-3.5" />
        Reset
      </Button>
      <Button disabled={file.isProcessing} size="sm" className="gap-1.5" onClick={handleDownload}>
        {file.isProcessing ? (
          <Spinner className="size-3.5" />
        ) : (
          <DownloadIcon className="size-3.5" />
        )}
        Download
      </Button>
      <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete}>
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>
    </div>
  );
}
