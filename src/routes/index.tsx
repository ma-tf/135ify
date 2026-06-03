import { ControlsPanel } from "@features/process/controls-panel";
import { PreviewArea } from "@features/process/preview-area";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <PreviewArea className="flex-1" />
      <ControlsPanel />
    </main>
  );
}
