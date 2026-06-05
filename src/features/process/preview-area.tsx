import { Dropzone } from "@features/process/dropzone";
import { ImagePreviewer } from "@features/process/image-previewer";
import { useFileStore } from "@stores/file-store";
import { cn } from "@lib/utils";

interface PreviewAreaProps {
  className?: string;
}

export function PreviewArea({ className }: PreviewAreaProps) {
  const hasFiles = useFileStore((s) => s.files.length > 0);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-6",
        className,
      )}
    >
      {hasFiles ? <ImagePreviewer /> : <Dropzone />}
    </div>
  );
}
