import type { DragEvent } from "react";

import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { DropzoneError } from "@features/process/dropzone-error";
import { DropzonePrompt } from "@features/process/dropzone-prompt";
import { useFileUpload } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithState } from "@stores/file-store";

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
    <div
      className={cn(
        "flex aspect-3/2 shrink-0 cursor-pointer flex-col items-center justify-center border-2 border-dashed text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : errors.length > 0
            ? "border-destructive/50 bg-destructive/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <input hidden {...getInputProps()} className="sr-only" />
      {errors.length > 0 ? <DropzoneError errors={errors} /> : <DropzonePrompt maxSize={maxSize} />}
    </div>
  );
}
