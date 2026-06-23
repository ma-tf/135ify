import { EditViewPage } from "@features/image/edit-view-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/image/$fileId")({
  component: EditViewPage,
});
