import { Dropzone } from "@features/process/dropzone";
import { RenderCarousel2 } from "@features/process/render-carousel";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";

interface ImageViewProps {
  className?: string;
}

export function ImageView({ className }: ImageViewProps) {
  const hasFiles = useFileStore((s) => s.files.length > 0);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-6",
        className,
      )}
    >
      <Dropzone />
      {hasFiles && <RenderCarousel2 />}
    </div>
  );
}
