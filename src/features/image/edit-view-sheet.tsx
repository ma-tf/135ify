import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { EditPanel } from "@features/image/controls-panel";
import { useEditView } from "@features/image/edit-view-context";
import { useIsMobile } from "@hooks/use-mobile";
import { useFile } from "@providers/file-context";
import { useNavigate } from "@tanstack/react-router";
import { XIcon } from "lucide-react";

export function EditViewSheet() {
  const navigate = useNavigate();
  const isDesktop = !useIsMobile(1024);
  const { imageSrc } = useEditView();
  const file = useFile();

  return (
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
                src={imageSrc}
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
            src={imageSrc}
            alt={file.fileName}
            className="max-h-[50vh] w-full rounded-md object-contain"
          />
        )}
        <EditPanel />
      </SheetContent>
    </Sheet>
  );
}
