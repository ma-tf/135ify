import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { useProcessImage } from "@features/process/use-process-image";
import { useFileUpload, formatBytes } from "@hooks/use-file-upload";
import { cn } from "@lib/utils";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";

interface DropzoneProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  className?: string;
}

export function Dropzone({
  maxFiles = 1,
  maxSize = 2097152, // 2MB
  accept = "image/*",
  className,
}: DropzoneProps) {
  const { processPreviewFlush } = useProcessImage();
  const [
    { isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps },
  ] = useFileUpload({
    accept,
    multiple: false,
    maxSize,
    maxFiles,
    onFilesChange: () => processPreviewFlush(),
  });

  return (
    <div className={cn("lg:m-w-4xl", className)}>
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed p-16 text-center transition-colors",
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
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
