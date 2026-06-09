import { RenderCarousel } from "@features/process/render-carousel";
import { cn } from "@lib/utils";

interface ImageViewProps {
  className?: string;
}

export function ImageView({ className }: ImageViewProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-6",
        className,
      )}
    >
      <RenderCarousel />
    </div>
  );
}
