import { GalleryStorageAdapter } from "@features/gallery/gallery-storage-adapter";
import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { PreviewDialog } from "@features/image/preview-dialog";
import { FileProvider } from "@providers/file-context";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/gallery/$imageId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { imageId } = useParams({ from: "/gallery/$imageId" });

  return (
    <EditViewCloseProvider onClose={() => void navigate({ to: "/gallery" })}>
      <GalleryStorageAdapter imageId={imageId}>
        <FileProvider fileId={imageId}>
          <EditViewProvider key={imageId}>
            <EditViewSheet />
            <PreviewDialog />
          </EditViewProvider>
        </FileProvider>
      </GalleryStorageAdapter>
    </EditViewCloseProvider>
  );
}
