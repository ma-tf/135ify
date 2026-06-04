import { Dropzone } from "@features/process/dropzone";
import { ImagePreviewer } from "@features/process/image-previewer";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";

interface PreviewAreaProps {
  className?: string;
}

export function PreviewArea({ className }: PreviewAreaProps) {
  const files = useFileStore((s) => s.files);

  return (
    <div className={cn("background relative flex items-center justify-center", className)}>
      {files.length === 0 ? <Dropzone /> : <ImagePreviewer />}
    </div>
  );
}
