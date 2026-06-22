import { EditSheet } from "@features/process/edit-sheet";
import { FileProvider } from "@features/process/file-context";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { useRenderStateStore } from "@stores/render-state-store";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_PHOTO } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/process/controls-panel", () => ({
  EditPanel: () => <div data-testid="edit-panel" />,
}));

const mockUseIsMobile = vi.fn((_breakpoint?: number) => false);
vi.mock("@hooks/use-mobile", () => ({
  useIsMobile: (breakpoint: number) => mockUseIsMobile(breakpoint),
}));

setupTests();

function renderSheetOpen(file = TEST_FILE_RECORD_PHOTO, renderUrl?: string | null) {
  useFileStore.setState({ files: [file] });
  useRenderStateStore.setState({
    states:
      renderUrl !== undefined
        ? { [file.id]: { renderUrl, isProcessing: false, renderError: null } }
        : {},
  });
  useEditSheetStore.setState({
    openSheetId: file.id,
    imageSrc: renderUrl ?? "",
    showOriginal: {},
    inspectUrl: null,
  });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={file.id}>
        <EditSheet />
      </FileProvider>
    </TestStorageProvider>,
  );
}

function getCloseButton() {
  const btn = document.body.querySelector("button[data-size='icon-sm']");
  if (!btn) throw new Error("Close button not found");
  return btn;
}

function getOverlayImage() {
  const btn = getCloseButton();
  const img = btn.nextElementSibling;
  if (!img || img.tagName !== "IMG") throw new Error("Overlay image not found");
  return img as HTMLImageElement;
}

describe("EditSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
  });

  it("renders sheet closed when openSheetId is null", () => {
    useFileStore.setState({ files: [TEST_FILE_RECORD_PHOTO] });
    useRenderStateStore.setState({ states: {} });
    useEditSheetStore.setState({
      openSheetId: null,
      imageSrc: "",
      showOriginal: {},
      inspectUrl: null,
    });

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
          <EditSheet />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(screen.queryByTestId("edit-panel")).toBeNull();
  });

  it("renders sheet closed when openSheetId is different file", () => {
    useFileStore.setState({ files: [TEST_FILE_RECORD_PHOTO] });
    useRenderStateStore.setState({ states: {} });
    useEditSheetStore.setState({ openSheetId: "other-file" });

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
          <EditSheet />
        </FileProvider>
      </TestStorageProvider>,
    );

    expect(screen.queryByTestId("edit-panel")).toBeNull();
  });

  it("renders sheet open when openSheetId matches file id", () => {
    renderSheetOpen();
    expect(screen.getByTestId("edit-panel")).toBeDefined();
  });

  it("close button calls setOpenSheetId(null)", () => {
    renderSheetOpen();

    fireEvent.click(getCloseButton());

    expect(useEditSheetStore.getState().openSheetId).toBeNull();
  });

  it("desktop renders image in overlay with correct src and alt", () => {
    mockUseIsMobile.mockReturnValue(false);

    renderSheetOpen(TEST_FILE_RECORD_PHOTO, "blob:render-url");
    const img = getOverlayImage();

    expect(img.getAttribute("src")).toBe("blob:render-url");
    expect(img.getAttribute("alt")).toBe(TEST_FILE_RECORD_PHOTO.fileName);
  });

  it("mobile renders image inline, not in overlay", () => {
    mockUseIsMobile.mockReturnValue(true);

    renderSheetOpen(TEST_FILE_RECORD_PHOTO, "blob:render-url");

    const btn = document.body.querySelector("button[data-size='icon-sm']");
    const overlayImg = btn?.nextElementSibling;
    expect(overlayImg?.tagName).not.toBe("IMG");

    const allImgs = document.body.querySelectorAll("[data-slot='sheet-content'] img");
    expect(allImgs.length).toBe(1);
    expect(allImgs[0].getAttribute("src")).toBe("blob:render-url");
  });

  it("desktop image onPointerDown stops propagation", () => {
    mockUseIsMobile.mockReturnValue(false);

    renderSheetOpen(TEST_FILE_RECORD_PHOTO, "blob:render-url");
    const img = getOverlayImage();

    const stopSpy = vi.fn();
    const pointerDownEvent = new PointerEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDownEvent, "stopPropagation", { value: stopSpy });

    fireEvent(img, pointerDownEvent);
    expect(stopSpy).toHaveBeenCalled();
  });
});
