import { Button } from "@components/ui/button";
import { formatBytes } from "@lib/utils";
import { CloudUploadIcon } from "lucide-react";

export function DropzonePrompt({ maxSize }: { maxSize: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3">
      <div className="mx-auto flex size-8 items-center justify-center rounded-full border border-border">
        <CloudUploadIcon className="size-4" />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">
          Choose a file or drag & drop here.
        </h3>
        <p className="text-xs text-secondary-foreground">
          JPEG, PNG, up to {formatBytes(maxSize)}.
        </p>
      </div>
      <Button size="sm">Browse File</Button>
    </div>
  );
}
