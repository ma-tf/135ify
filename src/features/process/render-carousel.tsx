import { Button } from "@components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@components/ui/carousel";
import { Dropzone } from "@features/process/dropzone";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { useRenderStore } from "@stores/render-store";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function RenderCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [_current, setCurrent] = useState(0);
  const files = useFileStore((s) => s.files);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const hasFiles = files.length > 0;

  return (
    <Carousel setApi={setApi}>
      <CarouselContent>
        <CarouselItem>
          <Dropzone />
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

  return (
    <div className={cn(className, "group relative flex items-center justify-center")}>
      <img
        src={fileItem.id === activeFileId && renderUrl ? renderUrl : fileItem.preview}
        className="max-h-[40dvh] w-auto max-w-full rounded-md object-contain"
        alt={fileItem.file.name}
      />
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (fileItem.file instanceof File) URL.revokeObjectURL(fileItem.preview);
          useFileStore.getState().removeFile(fileItem.id);
        }}
        variant="outline"
        size="icon"
        className="absolute inset-e-1 top-1 z-10 size-6 rounded-full opacity-0 shadow-sm group-hover:opacity-100"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
