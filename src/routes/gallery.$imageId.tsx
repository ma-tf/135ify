import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewPage } from "@features/image/edit-view-page";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery/$imageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <EditViewCloseProvider onClose={() => void navigate({ to: "/gallery" })}>
      <EditViewPage />
    </EditViewCloseProvider>
  );
}
