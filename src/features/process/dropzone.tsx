import type { FileRecord } from "@stores/file-store-types";
import type { DragEvent } from "react";

import { Button } from "@components/ui/button";
import { FILE_SIZE_LIMIT_BYTES } from "@config";
import { useFileUpload } from "@features/process/use-file-upload";
import { cn, formatBytes } from "@lib/utils";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";

interface DropzoneProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  onFilesChange?: (files: FileRecord[]) => void;
}

function DropzoneError({ errors }: { errors: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 text-destructive">
      <CircleAlertIcon className="size-6" />
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">File upload error(s)</h3>
        {errors.map((error) => (
          <p key={error} className="text-xs last:mb-0">
            {error}
          </p>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Click to try again</p>
    </div>
  );
}

function DropzonePrompt({ maxSize }: { maxSize: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3">
      <div className="mx-auto flex size-8 items-center justify-center rounded-full border border-border">
        <CloudUploadIcon className="size-4" />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">
          Choose a file or drag & drop here.
        </h3>
        <p className="text-xs text-secondary-foreground">
          JPEG, PNG, WebP, up to {formatBytes(maxSize)}.
        </p>
      </div>
      <Button size="sm" className="shadow-xs" asChild>
        <div>Browse File</div>
      </Button>
    </div>
  );
}

export function Dropzone({
  maxSize = FILE_SIZE_LIMIT_BYTES,
  accept = "image/jpeg,image/png,image/webp",
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
    onFilesChange: (allFiles) => {
      onFilesChangeProp?.(allFiles);
    },
  });

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetDragging();
    if (e.dataTransfer.files.length > 0) {
      addFiles([e.dataTransfer.files[0]]);
    }
  };

  return (
    <button
      type="button"
      data-no-drag
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
    </button>
  );
}
