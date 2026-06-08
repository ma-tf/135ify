import { Button } from "@components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@components/ui/carousel";
import { cn } from "@lib/utils";
import { useFileStore, type FileWithPreview } from "@stores/file-store";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function RenderCarousel2() {
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

  return (
    <Carousel setApi={setApi}>
      <CarouselContent>
        {files.map((fileItem) => (
          <CarouselItem key={fileItem.id}>
            <RenderCard className="bg-muted" fileItem={fileItem}></RenderCard>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

function RenderCard({ className, fileItem }: { className?: string; fileItem: FileWithPreview }) {
  const files = useFileStore((s) => s.files);

  return (
    <div className={cn(className, "group relative flex items-center justify-center")}>
      <img
        src={fileItem.preview}
        className="max-h-[80dvh] w-auto max-w-full rounded-md object-contain"
        alt={fileItem.file.name}
      />
      <Button
        onClick={(e) => {
          e.stopPropagation();
          const file = files.find((f) => f.id === fileItem.id);
          if (file?.file instanceof File) URL.revokeObjectURL(file.preview);
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
