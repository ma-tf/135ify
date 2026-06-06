import { Button } from "@components/ui/button";
import { useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

export function ImagePreviewer() {
  const files = useFileStore((s) => s.files);
  const setFiles = useFileStore((s) => s.setFiles);

  if (files.length === 0) return null;

  return (
    <div className="flex w-full items-center justify-center">
      {files.map((fileItem) => (
        <div key={fileItem.id} className="group relative overflow-hidden rounded-md border">
          <img
            src={fileItem.preview}
            className="max-h-[80dvh] w-auto max-w-full object-contain"
            alt={fileItem.file instanceof File ? fileItem.file.name : fileItem.file.name}
          />
          <Button
            onClick={() => {
              if (
                fileItem.preview &&
                fileItem.file instanceof File &&
                fileItem.file.type.startsWith("image/")
              ) {
                URL.revokeObjectURL(fileItem.preview);
              }
              setFiles(files.filter((f) => f.id !== fileItem.id));
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
  );
}
