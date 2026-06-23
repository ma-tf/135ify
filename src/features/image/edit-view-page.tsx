import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { PreviewDialog } from "@features/image/preview-dialog";
import { FileProvider } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { useRenderStateStore } from "@stores/render-state-store";
import { redirect, useParams } from "@tanstack/react-router";

export function EditViewPage() {
  const { fileId } = useParams({ from: "/image/$fileId" });
  const { files } = useStorage();
  const renderState = useRenderStateStore((s) => s.get(fileId));
  const file = files.find((f) => f.id === fileId);

  const defaultImageSrc = renderState?.renderUrl || file?.sourceUrl;

  if (!file) throw redirect({ to: "/", replace: true });

  return (
    <EditViewProvider defaultImageSrc={defaultImageSrc}>
      <FileProvider fileId={fileId}>
        <EditViewSheet />
        <PreviewDialog />
      </FileProvider>
    </EditViewProvider>
  );
}
