import type { ProcessParams } from "@stores/file-store-types";

import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { EditPanelButtons } from "@features/image/edit-panel-buttons";
import { useEditView } from "@features/image/edit-view-context";
import { FilmSelector } from "@features/image/film-selector";
import { GenerateAiGrainButton } from "@features/image/generate-ai-grain-button";
import { ParameterSlider } from "@features/image/parameter-slider";
import { useFileProcessing } from "@features/image/use-file-processing";
import { cn } from "@lib/utils";
import { useFile } from "@providers/file-context";

function HalationControls({ setParam }: { setParam: (partial: Partial<ProcessParams>) => void }) {
  const { params } = useFile();
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

function VignetteControls({ setParam }: { setParam: (partial: Partial<ProcessParams>) => void }) {
  const { params } = useFile();
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

function GrainControls({ setParam }: { setParam: (partial: Partial<ProcessParams>) => void }) {
  const { params } = useFile();
  const { showOriginal } = useEditView();
  if (!params) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Grain</h3>
      <GenerateAiGrainButton showOriginal={showOriginal} />
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

export function EditPanel() {
  const file = useFile();
  const { showOriginal, setShowOriginal } = useEditView();
  const { setParam, downloadFullSize } = useFileProcessing();

  const selectedFilmId = file.params.selectedFilmId;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Processing</h2>
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setShowOriginal(true)}
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
            onClick={() => setShowOriginal(false)}
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

      <HalationControls setParam={setParam} />
      <VignetteControls setParam={setParam} />
      <GrainControls setParam={setParam} />

      <EditPanelButtons
        setParam={setParam}
        downloadFullSize={downloadFullSize}
        showOriginal={showOriginal}
        setShowOriginal={setShowOriginal}
      />
    </div>
  );
}
