import { Dropzone } from "@features/process/dropzone";
import { FileProvider } from "@features/process/file-context";
import { RenderCard } from "@features/process/render-card";
import { useDragScroll } from "@hooks/use-drag-scroll";
import { cn } from "@lib/utils";
import { useStorage } from "@providers/storage-context";

const sharedFilmFrameClasses =
  "relative overflow-visible flex w-2xs shrink-0 flex-col lg:w-md border-r-4 border-transparent carousel-sprocket " +
  "before:content-[''] before:block before:shrink-0 before:w-[calc(100%+4px)] before:aspect-[72/11] before:bg-amber-700/40 before:pointer-events-none " +
  "after:content-[''] after:block after:shrink-0 after:w-[calc(100%+4px)] after:aspect-[72/11] after:bg-amber-700/40 after:pointer-events-none";

const filmFrameClasses = cn(sharedFilmFrameClasses, "[counter-increment:frame-counter]");
const dropzoneFrameClasses = cn(
  sharedFilmFrameClasses,
  "[counter-increment:none] [counter-reset:frame-counter]",
);

export function RenderCarousel() {
  const { files } = useStorage();
  const { ref, isDragging } = useDragScroll();

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
        <span className="pointer-events-none absolute top-px left-1/2 z-1 -translate-x-1/2 font-mono text-xs leading-4 text-black/40 before:content-[counter(frame-counter)]" />
      </div>
      {files.map((file) => (
        <div key={file.id} className={filmFrameClasses}>
          <FileProvider fileId={file.id}>
            <RenderCard />
          </FileProvider>
          <span className="pointer-events-none absolute top-px left-1/2 z-1 -translate-x-1/2 font-mono text-xs leading-4 text-black/40 before:content-[counter(frame-counter)]" />
        </div>
      ))}
    </div>
  );
}
