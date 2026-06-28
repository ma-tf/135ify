import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { PreviewDialog } from "@features/image/preview-dialog";
import { CardClickProvider } from "@features/process/card-click-context";
import { RenderCarousel } from "@features/process/render-carousel";
import { FileProvider } from "@providers/file-context";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  head: () => ({ meta: [{ title: "135ify | Film Strip" }] }),
});

function RouteComponent() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  return (
    <main className="flex flex-1 flex-row">
      <div className="mx-auto flex w-full min-w-0 flex-col items-center justify-center px-8">
        <CardClickProvider onCardClick={setSelectedFileId}>
          <RenderCarousel />
        </CardClickProvider>
      </div>
      {selectedFileId && (
        <FileProvider fileId={selectedFileId}>
          <EditViewProvider key={selectedFileId}>
            <EditViewCloseProvider onClose={() => setSelectedFileId(null)}>
              <EditViewSheet />
              <PreviewDialog />
            </EditViewCloseProvider>
          </EditViewProvider>
        </FileProvider>
      )}
    </main>
  );
}
