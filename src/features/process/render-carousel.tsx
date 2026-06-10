import { Button } from "@components/ui/button";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Dropzone } from "@features/process/dropzone";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { useRenderStore } from "@stores/render-store";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";

export function RenderCarousel() {
  const files = useFileStore((s) => s.files);

  const hasFiles = files.length > 0;

  return (
    <div className="w-full">
      <Dropzone />
      {hasFiles && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {files.map((fileItem) => (
            <RenderCard key={fileItem.id} fileItem={fileItem} />
          ))}
        </div>
      )}
    </div>
  );
}

function RenderCard({ fileItem }: { fileItem: FileWithPreview }) {
  const activeFileId = useFileStore((s) => s.activeFileId);
  const renderUrl = useRenderStore((s) => s.renderUrl);
  const { getFullSizeUrl } = useProcessImage();
  const [fullSizeUrl, setFullSizeUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleOpenFullSize = useCallback(async () => {
    const url = await getFullSizeUrl();
    if (url) {
      setFullSizeUrl(url);
      setOpen(true);
    }
  }, [getFullSizeUrl]);

  const handleClose = useCallback(() => {
    if (fullSizeUrl) {
      URL.revokeObjectURL(fullSizeUrl);
      setFullSizeUrl(null);
    }
    setOpen(false);
  }, [fullSizeUrl]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (fileItem.file instanceof File) URL.revokeObjectURL(fileItem.preview);
      useFileStore.getState().removeFile(fileItem.id);
    },
    [fileItem],
  );

  const isActive = fileItem.id === activeFileId;
  const src = isActive && renderUrl ? renderUrl : fileItem.preview;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md bg-muted">
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      )}
      <img
        src={src}
        className={cn(
          "h-full w-full object-cover transition-all group-hover:scale-105",
          imgLoaded ? "opacity-100" : "opacity-0",
        )}
        alt={fileItem.file.name}
        onLoad={() => setImgLoaded(true)}
      />

      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            void handleOpenFullSize();
          }}
          variant="secondary"
          size="icon"
          className="size-8 rounded-full shadow-sm"
        >
          <SearchIcon className="size-4" />
        </Button>
        <Button
          onClick={handleRemove}
          variant="secondary"
          size="icon"
          className="size-8 rounded-full shadow-sm"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent
          className="max-w-none border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-none"
          overlayClassName="bg-black/80"
        >
          <img
            src={fullSizeUrl ?? undefined}
            className="max-h-screen max-w-full object-contain p-4"
            alt={fileItem.file.name}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
