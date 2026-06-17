import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { FilmSelector } from "@features/process/film-selector";
import { ParameterSlider } from "@features/process/parameter-slider";
import { DEFAULT_PARAMS } from "@features/process/process-image";
import { useFileProcessing } from "@features/process/use-process-image";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { DownloadIcon, RotateCcwIcon } from "lucide-react";

function useParameterSection(fileId: string) {
  const params = useFileStore((s) => s.files.find((f) => f.id === fileId)?.params);
  const { setParam } = useFileProcessing(fileId);
  return { params, setParam };
}

function HalationControls({ fileId }: { fileId: string }) {
  const { params, setParam } = useParameterSection(fileId);
  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Halation</h3>
      <ParameterSlider
        label="Intensity"
        value={params.halationIntensity}
        onValueChange={(v) => setParam({ halationIntensity: v })}
      />
      <ParameterSlider
        label="Spread"
        value={params.halationSpread}
        onValueChange={(v) => setParam({ halationSpread: v })}
      />
      <ParameterSlider
        label="Threshold"
        value={params.halationThreshold}
        onValueChange={(v) => setParam({ halationThreshold: v })}
      />
    </div>
  );
}

function VignetteControls({ fileId }: { fileId: string }) {
  const { params, setParam } = useParameterSection(fileId);
  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Vignette</h3>
      <ParameterSlider
        label="Intensity"
        value={params.vignetteIntensity}
        onValueChange={(v) => setParam({ vignetteIntensity: v })}
      />
      <ParameterSlider
        label="Feather"
        value={params.vignetteFeather}
        onValueChange={(v) => setParam({ vignetteFeather: v })}
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
  const { params, setParam } = useParameterSection(fileId);
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
            setParam({ grainIntensity: selected?.intensity ?? 0 });
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
  onDownload,
}: {
  fileId: string;
  showOriginal: boolean;
  onShowOriginalChange: (v: boolean) => void;
  onDownload?: (url: string) => void;
}) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const { setParam, downloadFullSize } = useFileProcessing(fileId);
  const setRenderResult = useFileStore((s) => s.setRenderResult);

  if (!file) return null;

  const handleReset = () => {
    if (file.renderUrl) URL.revokeObjectURL(file.renderUrl);
    setParam(DEFAULT_PARAMS);
    setRenderResult(fileId, null, null);
  };

  const handleDownload = async () => {
    const url = await downloadFullSize();
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = file.file.name.replace(/\.[^.]+$/, "") + ".jpg";
    a.click();
    onDownload?.(url);
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
        onValueChange={(v) => setParam({ selectedFilmId: v })}
      />

      <HalationControls fileId={fileId} />
      <VignetteControls fileId={fileId} />
      <GrainControls fileId={fileId} />

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
          <RotateCcwIcon className="size-3.5" />
          Reset
        </Button>
        <Button disabled={file.isProcessing} size="sm" className="gap-1.5" onClick={handleDownload}>
          {file.isProcessing ? (
            <Spinner className="size-3.5" />
          ) : (
            <DownloadIcon className="size-3.5" />
          )}
          Download
        </Button>
      </div>
    </div>
  );
}
