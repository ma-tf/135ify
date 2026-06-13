import { Button } from "@components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@components/ui/drawer";
import { Spinner } from "@components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { FilmSelector } from "@features/process/film-selector";
import { ParameterSlider } from "@features/process/parameter-slider";
import { useProcessImage } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { DEFAULT_PARAMS, useFileStore } from "@stores/file-store";
import { ChevronUpIcon, DownloadIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";

function HalationControls({ fileId }: { fileId: string }) {
  const params = useFileStore((s) => s.files.find((f) => f.id === fileId)?.params);
  const updateFileParams = useFileStore((s) => s.updateFileParams);
  const { processPreviewDebounced } = useProcessImage();

  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Halation</h3>
      <ParameterSlider
        label="Intensity"
        value={params.halationIntensity}
        onValueChange={(v) => {
          updateFileParams(fileId, { halationIntensity: v });
          processPreviewDebounced(fileId);
        }}
      />
      <ParameterSlider
        label="Spread"
        value={params.halationSpread}
        onValueChange={(v) => {
          updateFileParams(fileId, { halationSpread: v });
          processPreviewDebounced(fileId);
        }}
      />
      <ParameterSlider
        label="Threshold"
        value={params.halationThreshold}
        onValueChange={(v) => {
          updateFileParams(fileId, { halationThreshold: v });
          processPreviewDebounced(fileId);
        }}
      />
    </div>
  );
}

function VignetteControls({ fileId }: { fileId: string }) {
  const params = useFileStore((s) => s.files.find((f) => f.id === fileId)?.params);
  const updateFileParams = useFileStore((s) => s.updateFileParams);
  const { processPreviewDebounced } = useProcessImage();

  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Vignette</h3>
      <ParameterSlider
        label="Intensity"
        value={params.vignetteIntensity}
        onValueChange={(v) => {
          updateFileParams(fileId, { vignetteIntensity: v });
          processPreviewDebounced(fileId);
        }}
      />
      <ParameterSlider
        label="Feather"
        value={params.vignetteFeather}
        onValueChange={(v) => {
          updateFileParams(fileId, { vignetteFeather: v });
          processPreviewDebounced(fileId);
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

function GrainControls({ fileId }: { fileId: string }) {
  const params = useFileStore((s) => s.files.find((f) => f.id === fileId)?.params);
  const updateFileParams = useFileStore((s) => s.updateFileParams);
  const { processPreviewDebounced } = useProcessImage();

  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Grain</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">ISO</span>
        <ToggleGroup
          type="single"
          variant="outline"
          value={params.grainIntensity === 0 ? "" : (INTENSITY_TO_ISO[params.grainIntensity] ?? "")}
          onValueChange={(value) => {
            const selected = ISO_PRESETS.find((p) => p.iso === value);
            updateFileParams(fileId, { grainIntensity: selected?.intensity ?? 0 });
            processPreviewDebounced(fileId);
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

export function EditPanel({
  fileId,
  showOriginal,
  onShowOriginalChange,
}: {
  fileId: string;
  showOriginal: boolean;
  onShowOriginalChange: (v: boolean) => void;
}) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const updateFileParams = useFileStore((s) => s.updateFileParams);
  const { getFullSizeUrl, processPreviewDebounced } = useProcessImage();
  const setRenderResult = useFileStore((s) => s.setRenderResult);

  if (!file) return null;

  const handleReset = () => {
    if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
    updateFileParams(fileId, DEFAULT_PARAMS);
    setRenderResult(fileId, null, null);
  };

  const handleDownload = async () => {
    const url = await getFullSizeUrl(fileId);
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = file.file.name.replace(/\.[^.]+$/, "") + ".jpg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Processing</h2>
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => onShowOriginalChange(true)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              showOriginal
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => onShowOriginalChange(false)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              !showOriginal
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Processed
          </button>
        </div>
      </div>

      <FilmSelector
        value={file.params.selectedFilmId}
        onValueChange={(v) => {
          updateFileParams(fileId, { selectedFilmId: v });
          processPreviewDebounced(fileId);
        }}
      />

      <HalationControls fileId={fileId} />
      <VignetteControls fileId={fileId} />
      <GrainControls fileId={fileId} />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleReset}>
          <RotateCcwIcon className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button
          disabled={file.isProcessing}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={handleDownload}
        >
          {file.isProcessing ? (
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

export function ControlsPanel({
  fileId,
  showOriginal,
  onShowOriginalChange,
}: {
  fileId: string;
  showOriginal: boolean;
  onShowOriginalChange: (v: boolean) => void;
}) {
  return (
    <div className="block border-t bg-background lg:hidden">
      <Drawer shouldScaleBackground={false} modal={false}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontalIcon className="h-4 w-4" />
              Adjust
            </span>
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </DrawerTrigger>
        <DrawerContent noOverlay>
          <EditPanel
            fileId={fileId}
            showOriginal={showOriginal}
            onShowOriginalChange={onShowOriginalChange}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
