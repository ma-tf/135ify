import { EditSheet } from "@features/process/edit-sheet";
import { FileProvider } from "@features/process/file-context";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { setupTests } from "@test-utils/setup";
import { TEST_FILE_PHOTO } from "@test-utils/test-fixtures";
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

function renderSheetOpen(file = TEST_FILE_PHOTO, imageSrc?: string) {
  useFileStore.setState({ files: [file] });
  useEditSheetStore.setState({
    openSheetId: file.id,
    imageSrc: imageSrc ?? file.renderUrl ?? "",
    showOriginal: {},
    inspectUrl: null,
  });

  return render(
    <FileProvider fileId={file.id}>
      <EditSheet />
    </FileProvider>,
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
    useFileStore.setState({ files: [TEST_FILE_PHOTO] });
    useEditSheetStore.setState({
      openSheetId: null,
      imageSrc: "",
      showOriginal: {},
      inspectUrl: null,
    });

    render(
      <FileProvider fileId={TEST_FILE_PHOTO.id}>
        <EditSheet />
      </FileProvider>,
    );

    expect(screen.queryByTestId("edit-panel")).toBeNull();
  });

  it("renders sheet closed when openSheetId is different file", () => {
    useFileStore.setState({ files: [TEST_FILE_PHOTO] });
    useEditSheetStore.setState({ openSheetId: "other-file" });

    render(
      <FileProvider fileId={TEST_FILE_PHOTO.id}>
        <EditSheet />
      </FileProvider>,
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

    renderSheetOpen();
    const img = getOverlayImage();

    expect(img.getAttribute("src")).toBe(TEST_FILE_PHOTO.renderUrl);
    expect(img.getAttribute("alt")).toBe(TEST_FILE_PHOTO.file.name);
  });

  it("mobile renders image inline, not in overlay", () => {
    mockUseIsMobile.mockReturnValue(true);

    renderSheetOpen();

    const btn = document.body.querySelector("button[data-size='icon-sm']");
    const overlayImg = btn?.nextElementSibling;
    expect(overlayImg?.tagName).not.toBe("IMG");

    const allImgs = document.body.querySelectorAll("[data-slot='sheet-content'] img");
    expect(allImgs.length).toBe(1);
    expect(allImgs[0].getAttribute("src")).toBe(TEST_FILE_PHOTO.renderUrl);
  });

  it("desktop image onPointerDown stops propagation", () => {
    mockUseIsMobile.mockReturnValue(false);

    renderSheetOpen();
    const img = getOverlayImage();

    const stopSpy = vi.fn();
    const pointerDownEvent = new PointerEvent("pointerdown", { bubbles: true });
    Object.defineProperty(pointerDownEvent, "stopPropagation", { value: stopSpy });

    fireEvent(img, pointerDownEvent);
    expect(stopSpy).toHaveBeenCalled();
  });
});
