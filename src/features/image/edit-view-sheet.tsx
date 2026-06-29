import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { Spinner } from "@components/ui/spinner";
import { EditPanel } from "@features/image/controls-panel";
import { useEditViewClose } from "@features/image/edit-view-close-context";
import { useEditView } from "@features/image/edit-view-context";
import { useIsMobile } from "@hooks/use-mobile";
import { useFile } from "@providers/file-context";
import { XIcon } from "lucide-react";

export function EditViewSheet() {
  const isDesktop = !useIsMobile(1024);
  const file = useFile();
  const { showOriginal } = useEditView();
  const onClose = useEditViewClose();

  const displayUrl = showOriginal ? file.sourceUrl : file.renderUrl;

  return (
    <Sheet
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        overlayContent={
          <>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon-sm"
              className="pointer-events-auto absolute top-3 left-3 cursor-pointer"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
            {isDesktop &&
              (displayUrl ? (
                <img
                  src={displayUrl}
                  alt={file.fileName}
                  className="pointer-events-auto max-h-[70vh] rounded-md object-contain"
                  onPointerDown={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="pointer-events-auto flex max-h-[70vh] w-80 items-center justify-center">
                  <Spinner className="size-8" />
                </div>
              ))}
          </>
        }
      >
        <SheetTitle className="sr-only">Edit Image</SheetTitle>
        <SheetDescription className="sr-only">Edit image settings</SheetDescription>
        {!isDesktop &&
          (displayUrl ? (
            <img
              src={displayUrl}
              alt={file.fileName}
              className="max-h-[50vh] w-full rounded-md object-contain"
            />
          ) : (
            <div className="flex h-[30vh] w-full items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ))}
        <EditPanel />
      </SheetContent>
    </Sheet>
  );
}
