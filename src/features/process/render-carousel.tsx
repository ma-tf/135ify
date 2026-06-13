import { Button } from "@components/ui/button";
import { Sheet, SheetContent } from "@components/ui/sheet";
import { EditPanel } from "@features/process/controls-panel";
import { Dropzone } from "@features/process/dropzone";
import { useDragScroll } from "@hooks/use-drag-scroll";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithState } from "@stores/file-store";
import { SlidersIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";

const sharedFilmFrameClasses =
  "relative overflow-visible flex w-2xs shrink-0 flex-col lg:w-md bg-neutral-950 carousel-sprocket " +
  "before:content-[''] before:block before:shrink-0 before:aspect-[72/11] before:bg-amber-700/40 before:pointer-events-none " +
  "after:content-[''] after:block after:shrink-0 after:aspect-[72/11] after:bg-amber-700/40 after:pointer-events-none";

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
        "flex max-w-full flex-row gap-1 overflow-x-auto bg-amber-700/40 px-3 [&::-webkit-scrollbar]:hidden",
        "cursor-grab touch-pan-x select-none",
        isDragging && "cursor-grabbing",
      )}
    >
      <div className={dropzoneFrameClasses}>
        <Dropzone className="bg-amber-700/10" />
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

function RenderCard({ fileItem, className }: { fileItem: FileWithState; className?: string }) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileItem.id)) ?? fileItem;
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleOpenEdit = useCallback(() => {
    setOpen(true);
  }, []);

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
        alt={file.file.name}
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
          side="right"
          showCloseButton={false}
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
              <img
                src={src}
                alt={file.file.name}
                className="max-h-[70vh] rounded-md object-contain"
              />
            </>
          }
        >
          <EditPanel
            fileId={file.id}
            showOriginal={showOriginal}
            onShowOriginalChange={setShowOriginal}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
