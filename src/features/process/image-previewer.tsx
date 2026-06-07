import { Alert, AlertDescription } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useProcessImage } from "@features/process/use-process-image";
import { useFileStore } from "@stores/file-store";
import { useRenderStore } from "@stores/render-store";
import { XIcon } from "lucide-react";

export function ImagePreviewer() {
  const files = useFileStore((s) => s.files);
  const activeFileId = useFileStore((s) => s.activeFileId);
  const renderUrl = useRenderStore((s) => s.renderUrl);
  const renderError = useRenderStore((s) => s.renderError);
  const isProcessing = useRenderStore((s) => s.isProcessing);
  const { processPreviewFlush } = useProcessImage();

  if (files.length === 0) return null;

  const fileItem = files.find((f) => f.id === activeFileId) ?? files.at(-1);

  if (!fileItem) return null;

  if (isProcessing && !renderUrl) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  const handleRemove = () => {
    if (fileItem.file instanceof File) URL.revokeObjectURL(fileItem.preview);
    useFileStore.getState().removeFile(fileItem.id);
    processPreviewFlush();
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {renderError && <RenderErrorAlert renderError={renderError} />}
      <div className="flex w-full items-center justify-center">
        <div className="group relative overflow-hidden rounded-md border">
          {renderUrl && (
            <img
              src={renderUrl}
              className="max-h-[80dvh] w-auto max-w-full object-contain"
              alt={fileItem.file instanceof File ? fileItem.file.name : fileItem.file.name}
            />
          )}
          <Button
            onClick={handleRemove}
            variant="outline"
            size="icon"
            className="absolute inset-e-1 top-1 size-6 rounded-full opacity-0 shadow-sm group-hover:opacity-100"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RenderErrorAlert({ renderError }: { renderError: string | null }) {
  return (
    <Alert variant="destructive" className="w-full max-w-xl">
      <AlertDescription>{renderError}</AlertDescription>
    </Alert>
  );
}
