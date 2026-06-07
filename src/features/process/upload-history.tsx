import { Button } from "@components/ui/button";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

export function UploadHistory() {
  const files = useFileStore((s) => s.files);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const setActiveFileId = useFileStore((s) => s.setActiveFileId);
  const { processPreviewFlush } = useProcessImage();

  const handleSelect = (id: string) => {
    setActiveFileId(id);
    processPreviewFlush();
  };

  const handleRemove = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.file instanceof File) URL.revokeObjectURL(file.preview);
    useFileStore.getState().removeFile(id);
    processPreviewFlush();
  };

  if (files.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2.5">
        {files.map((fileItem) => (
          <div
            key={fileItem.id}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-md border bg-accent/50 transition-all",
              fileItem.id === activeFileId && "ring-2 ring-primary",
            )}
            onClick={() => handleSelect(fileItem.id)}
          >
            <img
              src={fileItem.preview}
              className="h-30 w-full rounded-md object-cover"
              alt={fileItem.file instanceof File ? fileItem.file.name : fileItem.file.name}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(fileItem.id);
              }}
              variant="outline"
              size="icon"
              className="absolute inset-e-1 top-1 size-6 rounded-full opacity-0 shadow-sm group-hover:opacity-100"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
