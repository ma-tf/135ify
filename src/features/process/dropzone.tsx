import type { DragEvent } from "react";

import { Button } from "@components/ui/button";
import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { useFileUpload, formatBytes } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithState } from "@stores/file-store";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";

interface DropzoneProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  onFilesChange?: (files: FileWithState[]) => void;
}

export function Dropzone({
  maxSize = FILE_SIZE_LIMIT_BYTES,
  accept = "image/*",
  className,
  onFilesChange: onFilesChangeProp,
}: DropzoneProps) {
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
            : errors.length > 0
              ? "border-destructive/50 bg-destructive/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input hidden {...getInputProps({ multiple: false })} className="sr-only" />
        {errors.length > 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-3 text-destructive">
            <CircleAlertIcon className="size-6" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold">File upload error(s)</h3>
              {errors.map((error, index) => (
                <p key={index} className="text-xs last:mb-0">
                  {error}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click to try again</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
