import { Dropzone } from "@features/process/dropzone";
import { cn } from "@lib/utils";

interface PreviewAreaProps {
  className?: string;
}

export function PreviewArea({ className }: PreviewAreaProps) {
  return (
    <div className={cn("background relative flex items-center justify-center", className)}>
      <Dropzone />
    </div>
  );
}
