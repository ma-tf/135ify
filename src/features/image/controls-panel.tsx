import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { FEATURE_3D_PHOTO } from "@config";
import { useEditView } from "@features/image/edit-view-context";
import { FilmSelector } from "@features/image/film-selector";
import { ParameterSlider } from "@features/image/parameter-slider";
import { useSetParam } from "@features/image/use-set-param";
import { processToBlobUrl } from "@features/process/process-image";
import { cn } from "@lib/utils";
import { useFile } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { useRenderStateStore } from "@stores/render-state-store";
import { useNavigate } from "@tanstack/react-router";
import { DownloadIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";

function useParameterSection() {
  const file = useFile();
  const { setImageSrc } = useEditView();
  const setParam = useSetParam(file.id, file.sourceUrl, file.params, setImageSrc);
  return { params: file.params, setParam };
}

function HalationControls() {
  const { params, setParam } = useParameterSection();
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

function VignetteControls() {
  const { params, setParam } = useParameterSection();
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

function GrainControls() {
  const { params, setParam } = useParameterSection();
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

function EditPanelButtons() {
  const file = useFile();
  const { setImageSrc, setInspectUrl } = useEditView();
  const setParam = useSetParam(file.id, file.sourceUrl, file.params, setImageSrc);
  const { removeFile } = useStorage();
  const remove = useRenderStateStore((s) => s.remove);
  const navigate = useNavigate();

  const handleReset = () => {
    setParam(DEFAULT_PARAMS);
    setImageSrc(file.sourceUrl);
  };

  const handleDelete = () => {
    removeFile(file.id);
    remove(file.id);
    void navigate({ to: "/" });
  };

  const handleDownload = async () => {
    const url = await processToBlobUrl(file.sourceUrl, file.params);
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName.replace(/\.[^.]+$/, "") + ".jpg";
    a.click();
    if (FEATURE_3D_PHOTO) {
      setInspectUrl(url);
    } else {
      URL.revokeObjectURL(url);
    }
  };

  return (
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
      <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete}>
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>
    </div>
  );
}

export function EditPanel() {
  const file = useFile();
  const { showOriginal, setShowOriginal, setImageSrc } = useEditView();
  const setParam = useSetParam(file.id, file.sourceUrl, file.params, setImageSrc);

  const selectedFilmId = file.params.selectedFilmId;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Processing</h2>
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => {
              setShowOriginal(true);
              setImageSrc(file.sourceUrl);
            }}
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
            onClick={() => {
              setShowOriginal(false);
              setImageSrc(file.renderUrl || file.sourceUrl);
            }}
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

      <FilmSelector value={selectedFilmId} onValueChange={(v) => setParam({ selectedFilmId: v })} />

      <HalationControls />
      <VignetteControls />
      <GrainControls />

      <EditPanelButtons />
    </div>
  );
}
