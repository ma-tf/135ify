import { Button } from "@components/ui/button";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Dropzone } from "@features/process/dropzone";
import { useProcessImage } from "@features/process/use-process-image";
import { useDragScroll } from "@hooks/use-drag-scroll";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { useRenderStore } from "@stores/render-store";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";

const sharedFilmFrameClasses =
  "relative overflow-visible flex w-2xs shrink-0 flex-col lg:w-md " +
  "before:content-[''] before:block before:shrink-0 before:aspect-[72/11] before:bg-stone-700 before:pointer-events-none " +
  "before:[-webkit-mask-image:linear-gradient(180deg,#000_0_36.7%,transparent_36.7%_87.5%,#000_87.5%_100%),repeating-linear-gradient(90deg,#000_0_calc(100%/8*0.2915),transparent_calc(100%/8*0.2915)_calc(100%/8*0.7085),#000_calc(100%/8*0.7085)_calc(100%/8))] " +
  "before:[mask-image:linear-gradient(180deg,#000_0_36.7%,transparent_36.7%_87.5%,#000_87.5%_100%),repeating-linear-gradient(90deg,#000_0_calc(100%/8*0.2915),transparent_calc(100%/8*0.2915)_calc(100%/8*0.7085),#000_calc(100%/8*0.7085)_calc(100%/8))] " +
  "after:content-[''] after:block after:shrink-0 after:aspect-[72/11] after:bg-stone-700 after:pointer-events-none " +
  "after:[-webkit-mask-image:linear-gradient(180deg,#000_0_36.7%,transparent_36.7%_87.5%,#000_87.5%_100%),repeating-linear-gradient(90deg,#000_0_calc(100%/8*0.2915),transparent_calc(100%/8*0.2915)_calc(100%/8*0.7085),#000_calc(100%/8*0.7085)_calc(100%/8))] " +
  "after:[mask-image:linear-gradient(180deg,#000_0_36.7%,transparent_36.7%_87.5%,#000_87.5%_100%),repeating-linear-gradient(90deg,#000_0_calc(100%/8*0.2915),transparent_calc(100%/8*0.2915)_calc(100%/8*0.7085),#000_calc(100%/8*0.7085)_calc(100%/8))]";

const filmFrameClasses = cn(sharedFilmFrameClasses, "[counter-increment:frame-counter]");
const dropzoneFrameClasses = cn(sharedFilmFrameClasses, "[counter-increment:none]");

export function RenderCarousel() {
  const files = useFileStore((s) => s.files);
  const { ref, isDragging } = useDragScroll();

  return (
    <div
      id="render-carousel"
      ref={ref}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      className={cn(
        "flex-rowoverflow-x-auto flex w-full bg-neutral-950 px-3 py-3 [&::-webkit-scrollbar]:hidden",
        "cursor-grab touch-pan-x select-none",
        isDragging && "cursor-grabbing",
      )}
    >
      <div className={dropzoneFrameClasses}>
        <Dropzone />
      </div>
      {files.map((fileItem) => (
        <div key={fileItem.id} className={filmFrameClasses}>
          <RenderCard fileItem={fileItem} />
          <span className="pointer-events-none absolute top-px left-1/2 z-1 -translate-x-1/2 font-mono text-[8px] leading-2.5 text-black/40 before:content-[counter(frame-counter)]" />
        </div>
      ))}
    </div>
  );
}

function RenderCard({ fileItem, className }: { fileItem: FileWithPreview; className?: string }) {
  const activeFileId = useFileStore((s) => s.activeFileId);
  const renderUrl = useRenderStore((s) => s.renderUrl);
  const { getFullSizeUrl } = useProcessImage();
  const [fullSizeUrl, setFullSizeUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
    <div
      className={cn("group relative aspect-3/2 overflow-hidden", className)}
      onClick={() => setShowActions((v) => !v)}
    >
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

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition-opacity",
          showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
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
          className="flex items-center justify-center border-0 bg-transparent p-0 shadow-none ring-0"
          overlayClassName="bg-black/80"
        >
          <img
            src={fullSizeUrl ?? undefined}
            className="max-h-screen w-auto object-contain p-4"
            alt={fileItem.file.name}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
