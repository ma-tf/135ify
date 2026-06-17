import { Button } from "@components/ui/button";
import { SheetContent, SheetTitle, SheetDescription, Sheet } from "@components/ui/sheet";
import { FEATURE_3D_PHOTO } from "@config";
import { EditPanel } from "@features/process/controls-panel";
import { useIsMobile } from "@hooks/use-mobile";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { type FileWithState, useFileStore } from "@stores/file-store";
import { XIcon } from "lucide-react";

export function EditSheet({ fileItem }: { fileItem: FileWithState }) {
  const isDesktop = !useIsMobile(1024);
  const openSheetId = useEditSheetStore((s) => s.openSheetId);
  const setOpenSheetId = useEditSheetStore((s) => s.setOpenSheetId);
  const showOriginal = useEditSheetStore((s) => s.showOriginal[fileItem.id] ?? false);
  const setShowOriginal = useEditSheetStore((s) => s.setShowOriginal);
  const open = openSheetId === fileItem.id;
  const setPreviewUrl = useEditSheetStore((s) => s.setPreviewUrl);
  const file = useFileStore((s) => s.files.find((f) => f.id === fileItem.id)) ?? fileItem;
  const src = showOriginal || !file.renderUrl ? file.preview : file.renderUrl;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpenSheetId(v ? fileItem.id : null);
        if (!v) setShowOriginal(fileItem.id, false);
      }}
    >
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
        <EditPanel
          fileId={file.id}
          showOriginal={showOriginal}
          onShowOriginalChange={(v) => setShowOriginal(fileItem.id, v)}
          onDownload={(url) => {
            setOpenSheetId(null);
            if (FEATURE_3D_PHOTO) {
              setPreviewUrl(url);
            } else {
              URL.revokeObjectURL(url);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
