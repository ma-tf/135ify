import type { ReactNode } from "react";

import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { EditPanel } from "@features/process/controls-panel";
import { useFile } from "@features/process/file-context";
import { useIsMobile } from "@hooks/use-mobile";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { XIcon } from "lucide-react";

function EditSheetRoot({ children }: { children: ReactNode }) {
  const file = useFile();
  const openSheetId = useEditSheetStore((s) => s.openSheetId);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const setShowOriginal = useEditSheetStore((s) => s.setShowOriginal);
  return (
    <Sheet
      open={openSheetId === file.id}
      onOpenChange={(v) => {
        setOpenSheetId(v ? file.id : null);
        if (!v) setShowOriginal(file.id, false);
      }}
    >
      {children}
    </Sheet>
  );
}

export function EditSheet() {
  const file = useFile();
  const isDesktop = !useIsMobile(1024);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const showOriginal = useEditSheetStore((s) => s.showOriginal[file.id] ?? false);

  const src = showOriginal || !file.renderUrl ? file.preview : file.renderUrl;

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
            {isDesktop && (
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
        {!isDesktop && (
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
