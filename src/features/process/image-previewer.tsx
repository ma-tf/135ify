import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";
import { useState, type MouseEvent } from "react";

export function ImagePreviewer() {
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  if (files.length === 0) return null;

  return (
    <div>
      {files.map((fileItem) => (
        <div
          key={fileItem.id}
          className="group/item relative aspect-video overflow-hidden rounded-lg border"
        >
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

          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/item:opacity-100">
            <Button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                const fileToRemove = files.find((f) => f.id === fileItem.id);
                if (
                  fileToRemove?.preview &&
                  fileToRemove.file instanceof File &&
                  fileToRemove.file.type.startsWith("image/")
                ) {
                  URL.revokeObjectURL(fileToRemove.preview);
                }
                setFiles(files.filter((f) => f.id !== fileItem.id));
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
  );
}
