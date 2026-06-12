import { Button } from "@components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@components/ui/drawer";
import { Spinner } from "@components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { FilmSelector } from "@features/process/film-selector";
import { ParameterSlider } from "@features/process/parameter-slider";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { useParameterStore } from "@stores/parameter-store";
import { useRenderStore } from "@stores/render-store";
import { ChevronUpIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";

function HalationControls() {
  const { processPreviewDebounced } = useProcessImage();
  const intensity = useParameterStore((s) => s.halationIntensity);
  const setIntensity = useParameterStore((s) => s.setHalationIntensity);
  const spread = useParameterStore((s) => s.halationSpread);
  const setSpread = useParameterStore((s) => s.setHalationSpread);
  const threshold = useParameterStore((s) => s.halationThreshold);
  const setThreshold = useParameterStore((s) => s.setHalationThreshold);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Halation</h3>
      <ParameterSlider
        label="Intensity"
        value={intensity}
        onValueChange={(v) => {
          setIntensity(v);
          processPreviewDebounced();
        }}
      />
      <ParameterSlider
        label="Spread"
        value={spread}
        onValueChange={(v) => {
          setSpread(v);
          processPreviewDebounced();
        }}
      />
      <ParameterSlider
        label="Threshold"
        value={threshold}
        onValueChange={(v) => {
          setThreshold(v);
          processPreviewDebounced();
        }}
      />
    </div>
  );
}

function VignetteControls() {
  const { processPreviewDebounced } = useProcessImage();
  const intensity = useParameterStore((s) => s.vignetteIntensity);
  const setIntensity = useParameterStore((s) => s.setVignetteIntensity);
  const feather = useParameterStore((s) => s.vignetteFeather);
  const setFeather = useParameterStore((s) => s.setVignetteFeather);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Vignette</h3>
      <ParameterSlider
        label="Intensity"
        value={intensity}
        onValueChange={(v) => {
          setIntensity(v);
          processPreviewDebounced();
        }}
      />
      <ParameterSlider
        label="Feather"
        value={feather}
        onValueChange={(v) => {
          setFeather(v);
          processPreviewDebounced();
        }}
      />
    </div>
  );
}

const ISO_PRESETS = [
  { iso: "100", intensity: 25 },
  { iso: "200", intensity: 50 },
  { iso: "400", intensity: 75 },
  { iso: "800", intensity: 100 },
] as const;

const INTENSITY_TO_ISO: Record<number, string> = Object.fromEntries(
  ISO_PRESETS.map((p) => [p.intensity, p.iso]),
);

function GrainControls() {
  const { processPreviewDebounced } = useProcessImage();
  const intensity = useParameterStore((s) => s.grainIntensity);
  const setIntensity = useParameterStore((s) => s.setGrainIntensity);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Grain</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">ISO</span>
        <ToggleGroup
          type="single"
          variant="outline"
          value={intensity === 0 ? "" : (INTENSITY_TO_ISO[intensity] ?? "")}
          onValueChange={(value) => {
            const selected = ISO_PRESETS.find((p) => p.iso === value);
            setIntensity(selected?.intensity ?? 0);
            processPreviewDebounced();
          }}
        >
          {ISO_PRESETS.map((p) => (
            <ToggleGroupItem key={p.iso} value={p.iso}>
              {p.iso}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

function PanelContent() {
  const reset = useParameterStore((s) => s.reset);
  const { processPreviewDebounced, getFullSizeUrl } = useProcessImage();
  const isProcessing = useRenderStore((s) => s.isProcessing);

  const handleDownload = async () => {
    const url = await getFullSizeUrl();
    if (!url) return;

    const { files, activeFileId } = useFileStore.getState();
    const file = files.find((f) => f.id === activeFileId) ?? files.at(-1);
    if (!file) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = file.file.name.replace(/\.[^.]+$/, "") + ".jpg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="font-semibold text-foreground">Processing</h2>

      <FilmSelector onValueChange={() => processPreviewDebounced()} />

      <HalationControls />
      <VignetteControls />
      <GrainControls />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => {
            reset();
            processPreviewDebounced();
          }}
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          disabled={isProcessing}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={handleDownload}
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

export function ControlsPanel({ className }: { className?: string }) {
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
        <Drawer shouldScaleBackground={false} modal={false} defaultOpen>
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
