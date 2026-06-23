import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { PreviewDialog } from "@features/image/preview-dialog";
import { FileProvider } from "@providers/file-context";
import { useStorage } from "@providers/storage-context";
import { redirect, useParams } from "@tanstack/react-router";

export function EditViewPage() {
  const { fileId } = useParams({ from: "/image/$fileId" });
  const { files } = useStorage();
  const file = files.find((f) => f.id === fileId);

  if (!file) throw redirect({ to: "/", replace: true });

  return (
    <FileProvider fileId={fileId}>
      <EditViewProvider>
        <EditViewSheet />
        <PreviewDialog />
      </EditViewProvider>
    </FileProvider>
  );
}
