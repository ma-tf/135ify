import { Button } from "@components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@components/ui/drawer";
import { Separator } from "@components/ui/separator";
import { Spinner } from "@components/ui/spinner";
import { FilmSelector } from "@features/process/film-selector";
import { ParameterSlider } from "@features/process/parameter-slider";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { useParameterStore } from "@stores/parameter-store";
import { useRenderStore } from "@stores/render-store";
import { ChevronUpIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";

interface ControlsPanelProps {
  className?: string;
}

function PanelContent() {
  const vignetteIntensity = useParameterStore((s) => s.vignetteIntensity);
  const vignetteFeather = useParameterStore((s) => s.vignetteFeather);
  const grainIntensity = useParameterStore((s) => s.grainIntensity);
  const setVignetteIntensity = useParameterStore((s) => s.setVignetteIntensity);
  const setVignetteFeather = useParameterStore((s) => s.setVignetteFeather);
  const setGrainIntensity = useParameterStore((s) => s.setGrainIntensity);
  const reset = useParameterStore((s) => s.reset);
  const { processPreviewDebounced, processPreviewFlush, processDownload } = useProcessImage();
  const isProcessing = useRenderStore((s) => s.isProcessing);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="font-semibold text-foreground">Processing</h2>

      <FilmSelector onValueChange={() => processPreviewFlush()} />

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Vignette</h3>
        <ParameterSlider
          label="Intensity"
          value={vignetteIntensity}
          onValueChange={(v) => {
            setVignetteIntensity(v);
            processPreviewDebounced();
          }}
          onValueCommit={() => processPreviewFlush()}
        />
        <ParameterSlider
          label="Feather"
          value={vignetteFeather}
          onValueChange={(v) => {
            setVignetteFeather(v);
            processPreviewDebounced();
          }}
          onValueCommit={() => processPreviewFlush()}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Grain</h3>
        <ParameterSlider
          label="Intensity"
          value={grainIntensity}
          onValueChange={(v) => {
            setGrainIntensity(v);
            processPreviewDebounced();
          }}
          onValueCommit={() => processPreviewFlush()}
        />
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => {
            reset();
            processPreviewFlush();
          }}
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          disabled={isProcessing}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => void processDownload()}
        >
          {isProcessing ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <DownloadIcon className="h-3.5 w-3.5" />
          )}
          Download
        </Button>
      </div>
    </div>
  );
}

export function ControlsPanel({ className }: ControlsPanelProps) {
  const hasFiles = useFileStore((s) => s.files.length > 0);

  if (!hasFiles) return null;

  return (
    <>
      <div
        className={cn(
          "hidden overflow-y-auto border-l bg-background lg:flex lg:w-80 lg:flex-col",
          className,
        )}
      >
        <PanelContent />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background lg:hidden">
        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            >
              Processing
              <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent noOverlay>
            <PanelContent />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
