import { Button } from "@components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@components/ui/carousel";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Dropzone } from "@features/process/dropzone";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { useRenderStore } from "@stores/render-store";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function RenderCarousel() {
  const apiRef = useRef<CarouselApi>(null);
  const files = useFileStore((s) => s.files);
  const pendingScrollRef = useRef(false);
  const reInitRegisteredRef = useRef(false);

  const hasFiles = files.length > 0;

  return (
    <Carousel
      className="w-full"
      setApi={(api) => {
        apiRef.current = api;
        if (api && !reInitRegisteredRef.current) {
          reInitRegisteredRef.current = true;
          api.on("reInit", () => {
            if (pendingScrollRef.current) {
              pendingScrollRef.current = false;
              api.scrollTo(useFileStore.getState().files.length);
            }
          });
        }
      }}
    >
      <CarouselContent>
        <CarouselItem>
          <Dropzone
            onFilesChange={() => {
              pendingScrollRef.current = true;
            }}
          />
        </CarouselItem>
        {files.map((fileItem) => (
          <CarouselItem key={fileItem.id}>
            <RenderCard className="bg-muted" fileItem={fileItem}></RenderCard>
          </CarouselItem>
        ))}
      </CarouselContent>
      {hasFiles && <CarouselPrevious />}
      {hasFiles && <CarouselNext />}
    </Carousel>
  );
}

function RenderCard({ className, fileItem }: { className?: string; fileItem: FileWithPreview }) {
  const activeFileId = useFileStore((s) => s.activeFileId);
  const renderUrl = useRenderStore((s) => s.renderUrl);
  const { getFullSizeUrl } = useProcessImage();
  const [fullSizeUrl, setFullSizeUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className={cn(className, "group relative flex items-center justify-center")}>
      <img
        src={fileItem.id === activeFileId && renderUrl ? renderUrl : fileItem.preview}
        className="max-h-[40dvh] w-auto max-w-full rounded-md object-contain"
        alt={fileItem.file.name}
      />

      <div className="pointer-events-none absolute inset-0 rounded-md bg-black/0 transition-colors group-hover:bg-black/30" />

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex gap-2">
          <Button
            onClick={handleOpenFullSize}
            variant="outline"
            size="icon"
            className="size-8 rounded-full shadow-sm"
          >
            <SearchIcon className="size-4" />
          </Button>
          <Button
            onClick={handleRemove}
            variant="outline"
            size="icon"
            className="size-8 rounded-full shadow-sm"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
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
