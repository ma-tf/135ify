import { Button } from "@components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@components/ui/sheet";
import { EditPanel } from "@features/process/controls-panel";
import { Dropzone } from "@features/process/dropzone";
import { useDragScroll } from "@hooks/use-drag-scroll";
import { useIsMobile } from "@hooks/use-mobile";
import { FEATURE_3D_PHOTO } from "@lib/flags";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithState } from "@stores/file-store";
import { SlidersIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

const sharedFilmFrameClasses =
  "relative overflow-visible flex w-2xs shrink-0 flex-col lg:w-md border-r-4 border-transparent carousel-sprocket " +
  "before:content-[''] before:block before:shrink-0 before:w-[calc(100%+4px)] before:aspect-[72/11] before:bg-amber-700/40 before:pointer-events-none " +
  "after:content-[''] after:block after:shrink-0 after:w-[calc(100%+4px)] after:aspect-[72/11] after:bg-amber-700/40 after:pointer-events-none";

const filmFrameClasses = cn(sharedFilmFrameClasses, "[counter-increment:frame-counter]");
const dropzoneFrameClasses = cn(sharedFilmFrameClasses, "[counter-increment:none]");

export function RenderCarousel() {
  const files = useFileStore((s) => s.files);
  const { ref, isDragging } = useDragScroll();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  return (
    <div
      id="render-carousel"
      ref={ref}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      className={cn(
        "mx-auto inline-flex max-w-full flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden",
        "cursor-grab touch-pan-x select-none",
        isDragging && "cursor-grabbing",
      )}
    >
      <div className={dropzoneFrameClasses}>
        <Dropzone className="bg-amber-700/10 shadow-[4px_0_0_0_--theme(--color-amber-700/0.4)]" />
      </div>
      {files.map((fileItem) => (
        <div key={fileItem.id} className={filmFrameClasses}>
          <RenderCard
            fileItem={fileItem}
            activeCardId={activeCardId}
            setActiveCardId={setActiveCardId}
          />
          <span className="pointer-events-none absolute top-px left-1/2 z-1 -translate-x-1/2 font-mono text-[8px] leading-2.5 text-black/40 before:content-[counter(frame-counter)]" />
        </div>
      ))}
    </div>
  );
}

function RenderCard({
  fileItem,
  className,
  activeCardId,
  setActiveCardId,
}: {
  fileItem: FileWithState;
  className?: string;
  activeCardId: string | null;
  setActiveCardId: Dispatch<SetStateAction<string | null>>;
}) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileItem.id)) ?? fileItem;
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isDesktop = !useIsMobile(1024);

  const showActions = activeCardId === fileItem.id;

  const handleOpenEdit = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewUrl]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.file instanceof File) URL.revokeObjectURL(file.preview);
      if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
      useFileStore.getState().removeFile(file.id);
    },
    [file],
  );

  const src = showOriginal || !file.renderUrl ? file.preview : file.renderUrl;

  return (
    <div
      className={cn(
        "group relative aspect-3/2 overflow-hidden bg-amber-700/40 shadow-[4px_0_0_0_--theme(--color-amber-700/0.4)]",
        className,
      )}
      onClick={() => {
        setActiveCardId((prev) => (prev === fileItem.id ? null : fileItem.id));
      }}
    >
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-pulse rounded-full bg-muted-foreground/20" />
        </div>
      )}
      <img
        src={src}
        className={cn(
          "h-full w-full object-contain transition-all group-hover:scale-105",
          imgLoaded ? "opacity-100" : "opacity-0",
          showActions
            ? "brightness-75 saturate-75"
            : "group-hover:brightness-85 group-hover:saturate-85",
        )}
        alt={file.file.name}
        onLoad={() => setImgLoaded(true)}
      />

      <div
        className={cn(
          "absolute inset-0 bg-black/25 transition-opacity",
          showActions ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 transition-opacity",
          showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit();
          }}
          variant="secondary"
          size="icon"
          className="size-8 rounded-full shadow-sm"
        >
          <SlidersIcon className="size-4" />
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

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setShowOriginal(false);
        }}
      >
        <SheetContent
          className={!isDesktop ? "pt-8" : ""}
          side={isDesktop ? "right" : "bottom"}
          showCloseButton={isDesktop}
          overlayContent={
            <>
              <Button
                onClick={() => setOpen(false)}
                variant="ghost"
                size="icon-sm"
                className="pointer-events-auto absolute top-3 left-3 cursor-pointer"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
              {isDesktop && (
                <img
                  src={src}
                  alt={file.file.name}
                  className="pointer-events-auto max-h-[70vh] rounded-md object-contain"
                  onPointerDown={(e) => e.stopPropagation()}
                />
              )}
            </>
          }
        >
          <SheetTitle className="sr-only">Edit Image</SheetTitle>
          <SheetDescription className="sr-only">Edit image settings</SheetDescription>
          {!isDesktop && (
            <img
              src={src}
              alt={file.file.name}
              className="max-h-[50vh] w-full rounded-md object-contain"
            />
          )}
          <EditPanel
            fileId={file.id}
            showOriginal={showOriginal}
            onShowOriginalChange={setShowOriginal}
            onDownload={(url) => {
              setOpen(false);
              if (FEATURE_3D_PHOTO) {
                setPreviewUrl(url);
              } else {
                URL.revokeObjectURL(url);
              }
            }}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={!!previewUrl}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-lg" />
          {previewUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <img
                src={previewUrl}
                alt={file.file.name}
                className="max-h-[85vh] max-w-[90vw] cursor-pointer border-[1cm] border-white object-contain shadow-lg"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="fixed top-3 left-3 z-60 cursor-pointer"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          )}
        </DialogPortal>
      </Dialog>
    </div>
  );
}
