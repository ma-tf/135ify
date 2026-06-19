import type { ReactNode } from "react";

import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { EditPanel } from "@features/process/controls-panel";
import { useFileId } from "@features/process/file-context";
import { useIsMobile } from "@hooks/use-mobile";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

function EditSheetRoot({ children }: { children: ReactNode }) {
  const fileId = useFileId();
  const openSheetId = useEditSheetStore((s) => s.openSheetId);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const setShowOriginal = useEditSheetStore((s) => s.setShowOriginal);
  return (
    <Sheet
      open={openSheetId === fileId}
      onOpenChange={(v) => {
        setOpenSheetId(v ? fileId : null);
        if (!v) setShowOriginal(fileId, false);
      }}
    >
      {children}
    </Sheet>
  );
}

export function EditSheet() {
  const fileId = useFileId();
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const isDesktop = !useIsMobile(1024);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const showOriginal = useEditSheetStore((s) => s.showOriginal[fileId] ?? false);

  const src = showOriginal || !file?.renderUrl ? (file?.preview ?? "") : file.renderUrl;

  return (
    <EditSheetRoot>
      <SheetContent
        className={!isDesktop ? "pt-8" : ""}
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        overlayContent={
          <>
            <Button
              onClick={() => setOpenSheetId(null)}
              variant="ghost"
              size="icon-sm"
              className="pointer-events-auto absolute top-3 left-3 cursor-pointer"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
            {isDesktop && file && (
              <img
                src={src}
                alt={file.file.name}
                className="pointer-events-auto max-h-[70vh] rounded-md object-contain"
                onPointerDown={(e) => e.stopPropagation()}
              />
            )}
          </>
        }
      >
        <SheetTitle className="sr-only">Edit Image</SheetTitle>
        <SheetDescription className="sr-only">Edit image settings</SheetDescription>
        {!isDesktop && file && (
          <img
            src={src}
            alt={file.file.name}
            className="max-h-[50vh] w-full rounded-md object-contain"
          />
        )}
        <EditPanel />
      </SheetContent>
    </EditSheetRoot>
  );
}
