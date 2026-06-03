import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useFileUpload, formatBytes } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { useState, type MouseEvent } from "react";

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
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const syncFiles = useFileStore((s) => s.setFiles);

  const [
    { files, isDragging },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    multiple,
    maxSize,
    maxFiles,
    onFilesChange: syncFiles,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {files.length === 0 && (
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
      )}

      {files.length > 0 && (
        <div>
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="group/item relative aspect-video overflow-hidden rounded-lg border"
            >
              {fileItem.preview ? (
                <>
                  {loadingImages[fileItem.id] !== false && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg border bg-muted/50">
                      <Spinner className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    onLoad={() =>
                      setLoadingImages((prev) => ({
                        ...prev,
                        [fileItem.id]: false,
                      }))
                    }
                    className={cn(
                      "h-full w-full rounded-lg border object-cover transition-all group-hover/item:scale-105",
                      loadingImages[fileItem.id] !== false ? "opacity-0" : "opacity-100",
                    )}
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/item:opacity-100">
                <Button
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    removeFile(fileItem.id);
                  }}
                  variant="secondary"
                  size="icon"
                  className="size-7"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
