import { Button } from "@components/ui/button";
import { useFileUpload, formatBytes } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { ImageIcon, UploadIcon } from "lucide-react";

interface DropzoneProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function Dropzone({
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  accept = "image/*",
  multiple = false,
  className,
}: DropzoneProps) {
  const syncFiles = useFileStore((s) => s.setFiles);

  const [
    { isDragging },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps },
  ] = useFileUpload({
    accept,
    multiple,
    maxSize,
    maxFiles,
    onFilesChange: syncFiles,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition-colors",
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
        <input hidden {...getInputProps()} className="sr-only" />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              isDragging ? "bg-primary/10" : "bg-muted",
            )}
          >
            <ImageIcon
              className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload image to gallery</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {formatBytes(maxSize)} each (max {maxFiles} file)
            </p>
          </div>
          <Button>
            <UploadIcon className="h-4 w-4" />
            Select image
          </Button>
        </div>
      </div>
    </div>
  );
}
