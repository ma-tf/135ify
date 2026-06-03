import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { ParameterSlider } from "@features/process/parameter-slider";
import { type ParametersState, type ParametersActions, useParameters } from "@hooks/use-parameters";
import { cn } from "@lib/utils";
import { RotateCcwIcon, DownloadIcon } from "lucide-react";

interface ControlsPanelProps {
  className?: string;
}

function PanelContent({
  parameters,
  parameterActions,
}: {
  parameters: ParametersState;
  parameterActions: ParametersActions;
}) {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="font-semibold text-foreground">Processing</h2>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Vignette</h3>
        <ParameterSlider
          label="Intensity"
          value={parameters.vignetteIntensity}
          onValueChange={parameterActions.setVignetteIntensity}
        />
        <ParameterSlider
          label="Feather"
          value={parameters.vignetteFeather}
          onValueChange={parameterActions.setVignetteFeather}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Grain</h3>
        <ParameterSlider
          label="Intensity"
          value={parameters.grainIntensity}
          onValueChange={parameterActions.setGrainIntensity}
        />
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={parameterActions.reset}
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button size="sm" className="flex-1 gap-1.5">
          <DownloadIcon className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </div>
  );
}

export function ControlsPanel({ className }: ControlsPanelProps) {
  const [parameters, parameterActions] = useParameters();

  return (
    <>
      <div
        className={cn(
          "hidden overflow-y-auto border-l bg-background lg:flex lg:w-80 lg:flex-col",
          className,
        )}
      >
        <PanelContent parameters={parameters} parameterActions={parameterActions} />
      </div>
    </>
  );
}
