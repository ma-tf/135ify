import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { EditPanel } from "@features/image/controls-panel";
import { EditViewProvider } from "@features/image/edit-view-context";
import { PreviewDialog } from "@features/image/preview-dialog";
import { FileProvider } from "@features/process/file-context";
import { useIsMobile } from "@hooks/use-mobile";
import { useStorage } from "@providers/storage-context";
import { useRenderStateStore } from "@stores/render-state-store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/image/$fileId")({
  component: EditViewRoute,
});

function EditViewRoute() {
  const { fileId } = Route.useParams();
  const navigate = useNavigate();
  const isDesktop = !useIsMobile(1024);
  const { files } = useStorage();
  const renderState = useRenderStateStore((s) => s.get(fileId));
  const file = files.find((f) => f.id === fileId);

  useEffect(() => {
    if (!file) {
      toast("Image not found");
      void navigate({ to: "/", replace: true });
    }
  }, [file, navigate]);

  if (!file) return null;

  const defaultImageSrc = renderState?.renderUrl || file.sourceUrl;

  return (
    <EditViewProvider defaultImageSrc={defaultImageSrc}>
      <FileProvider fileId={fileId}>
        <Sheet
          open
          onOpenChange={(v) => {
            if (!v) void navigate({ to: "/" });
          }}
        >
          <SheetContent
            side={isDesktop ? "right" : "bottom"}
            showCloseButton={false}
            overlayContent={
              <>
                <Button
                  onClick={() => void navigate({ to: "/" })}
                  variant="ghost"
                  size="icon-sm"
                  className="pointer-events-auto absolute top-3 left-3 cursor-pointer"
                >
                  <XIcon />
                  <span className="sr-only">Close</span>
                </Button>
                {isDesktop && (
                  <img
                    src={defaultImageSrc}
                    alt={file.fileName}
                    className="pointer-events-auto max-h-[70vh] rounded-md object-contain"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                )}
              </>
            }
          >
            <SheetTitle className="sr-only">Edit Image</SheetTitle>
            <SheetDescription className="sr-only">Edit image settings</SheetDescription>
            {!isDesktop && (
              <img
                src={defaultImageSrc}
                alt={file.fileName}
                className="max-h-[50vh] w-full rounded-md object-contain"
              />
            )}
            <EditPanel />
          </SheetContent>
        </Sheet>
        <PreviewDialog />
      </FileProvider>
    </EditViewProvider>
  );
}
