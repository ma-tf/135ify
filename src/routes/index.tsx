import { ControlsPanel } from "@features/process/controls-panel";
import { ImageView } from "@features/process/image-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <ImageView className="flex-1 pb-16 lg:pb-0" />
      <ControlsPanel />
    </main>
  );
}
