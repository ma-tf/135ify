import type { DragEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { useProcessImage } from "@features/process/use-process-image";
import { useFileUpload, formatBytes } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";

interface DropzoneProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export function Dropzone({
  maxSize = 2097152, // 2MB
  accept = "image/*",
  className,
  onFilesChange: onFilesChangeProp,
}: DropzoneProps) {
  const { processPreviewDebounced } = useProcessImage();
  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      openFileDialog,
      getInputProps,
      addFiles,
      resetDragging,
    },
  ] = useFileUpload({
    accept,
    multiple: true,
    maxSize,
    onFilesAdded: (files) => {
      if (files.length > 0) useFileStore.getState().setActiveFileId(files[0].id);
    },
    onFilesChange: (allFiles) => {
      processPreviewDebounced();
      onFilesChangeProp?.(allFiles);
    },
  });

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetDragging();
    if (e.dataTransfer.files.length > 0) {
      addFiles([e.dataTransfer.files[0]]);
    }
  };

  return (
    <div className={cn("shrink-0", className)}>
      <div
        className={cn(
          "flex aspect-3/2 cursor-pointer flex-col items-center justify-center border-2 border-dashed text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input hidden {...getInputProps({ multiple: false })} className="sr-only" />
        <div className="flex flex-col items-center gap-1.5 px-3">
          <div className="mx-auto flex size-8 items-center justify-center rounded-full border border-border">
            <CloudUploadIcon className="size-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">
              Choose a file or drag & drop here.
            </h3>
            <p className="text-xs text-secondary-foreground">
              JPEG, PNG, up to {formatBytes(maxSize)}.
            </p>
          </div>
          <Button size="sm">Browse File</Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-2">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
