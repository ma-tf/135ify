import { Button } from "@components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@components/ui/drawer";
import { Separator } from "@components/ui/separator";
import { ParameterSlider } from "@features/process/parameter-slider";
import { type ParametersState, type ParametersActions, useParameters } from "@hooks/use-parameters";
import { cn } from "@lib/utils";
import { useFileStore } from "@stores/file-store";
import { ChevronUpIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";

interface ControlsPanelProps {
  className?: string;
}

function PanelContent({
  parameters,
  parameterActions,
  hasFiles = false,
}: {
  parameters: ParametersState;
  parameterActions: ParametersActions;
  hasFiles?: boolean;
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
        <Button disabled={!hasFiles} size="sm" className="flex-1 gap-1.5">
          <DownloadIcon className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </div>
  );
}

export function ControlsPanel({ className }: ControlsPanelProps) {
  const [parameters, parameterActions] = useParameters();
  const hasFiles = useFileStore((s) => s.files.length > 0);

  return (
    <>
      <div
        className={cn(
          "hidden overflow-y-auto border-l bg-background lg:flex lg:w-80 lg:flex-col",
          className,
        )}
      >
        <PanelContent
          parameters={parameters}
          parameterActions={parameterActions}
          hasFiles={hasFiles}
        />
      </div>

      {/* Mobile bottom drawer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            >
              Processing
              <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <PanelContent
              parameters={parameters}
              parameterActions={parameterActions}
              hasFiles={hasFiles}
            />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
