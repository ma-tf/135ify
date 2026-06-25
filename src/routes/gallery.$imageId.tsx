import { EditViewPage } from "@features/image/edit-view-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery/$imageId")({
  component: EditViewPage,
});
