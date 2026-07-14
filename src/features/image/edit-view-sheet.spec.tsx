import type { FileRecord } from "@stores/file-store-types";

import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_WITH_RENDER } from "@test-utils/test-fixtures.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@components/ui/spinner", () => ({
  Spinner: ({ className }: any) => <div data-testid="spinner" className={className} />,
}));

vi.mock("@features/image/edit-panel", () => ({
  EditPanel: () => <div data-testid="edit-panel" />,
}));

const { mockOnSheetClose } = vi.hoisted(() => ({
  mockOnSheetClose: vi.fn(),
}));

vi.mock("@components/ui/sheet", () => ({
  Sheet: ({ children, onOpenChange }: any) => {
    mockOnSheetClose.mockImplementation(() => onOpenChange(false));
    return <>{children}</>;
  },
  SheetContent: ({ children, overlayContent }: any) => (
    <div data-testid="sheet-content">
      {overlayContent}
      {children}
    </div>
  ),
  SheetTitle: ({ children }: any) => <div data-testid="sheet-title">{children}</div>,
  SheetDescription: ({ children }: any) => <div data-testid="sheet-description">{children}</div>,
}));

const { mockUseFileReturn, defaultFileRecord } = vi.hoisted(() => {
  const file: FileRecord = {
    id: "file-1",
    fileName: "test.jpg",
    sourceUrl: "blob:preview-url",
    params: {
      selectedFilmId: "none",
      halationIntensity: 0,
      halationSpread: 0,
      halationThreshold: 0,
      vignetteIntensity: 0,
      vignetteFeather: 0,
      grainIntensity: 0,
    },
    convexId: null,
    createdAt: Date.now(),
    renderUrl: "blob:render-url",
    isProcessing: false,
    renderError: null,
  };
  return {
    mockUseFileReturn: { value: { ...file } },
    defaultFileRecord: file,
  };
});

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("@hooks/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: () => mockUseFileReturn.value,
}));

import { useIsMobile } from "@hooks/use-mobile";

setupTests();

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSheet() {
  useFileStore.setState({ files: [TEST_FILE_RECORD_WITH_RENDER] });

  return render(
    <FileProvider fileId={TEST_FILE_RECORD_WITH_RENDER.id}>
      <EditViewCloseProvider onClose={mockOnClose}>
        <EditViewProvider>
          <EditViewSheet />
        </EditViewProvider>
      </EditViewCloseProvider>
    </FileProvider>,
  );
}

describe("EditViewSheet", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    mockUseFileReturn.value = { ...defaultFileRecord };
  });

  it("renders EditPanel inside the sheet", () => {
    renderSheet();
    expect(screen.getByTestId("edit-panel")).toBeDefined();
  });

  it("renders sr-only title and description", () => {
    renderSheet();
    expect(screen.getByText("Edit Image")).toBeDefined();
    expect(screen.getByText("Edit image settings")).toBeDefined();
  });

  it("calls onClose when close button is clicked", () => {
    renderSheet();
    const closeBtn = screen.getByText("Close");
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("renders image with alt text from file", () => {
    renderSheet();
    const img = screen.getByAltText(TEST_FILE_RECORD_WITH_RENDER.fileName);
    expect(img.getAttribute("alt")).toBe(TEST_FILE_RECORD_WITH_RENDER.fileName);
  });

  it("renders image in overlay on desktop", () => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    renderSheet();
    const img = screen.getByAltText(TEST_FILE_RECORD_WITH_RENDER.fileName);
    expect(img.className).toContain("max-h-[70vh]");
  });

  it("renders image in content on mobile", () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    renderSheet();
    const img = screen.getByAltText(TEST_FILE_RECORD_WITH_RENDER.fileName);
    expect(img.className).toContain("max-h-[50vh]");
  });

  it("shows spinner in overlay when desktop and no renderUrl", () => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    mockUseFileReturn.value = { ...TEST_FILE_RECORD_WITH_RENDER, renderUrl: null, sourceUrl: "" };

    renderSheet();

    const spinners = screen.getAllByTestId("spinner");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("shows spinner in content when mobile and no renderUrl", () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    mockUseFileReturn.value = { ...TEST_FILE_RECORD_WITH_RENDER, renderUrl: null, sourceUrl: "" };

    renderSheet();

    const spinners = screen.getAllByTestId("spinner");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("closes sheet when onOpenChange fires with false", () => {
    renderSheet();
    mockOnSheetClose();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("stops propagation on pointer down on desktop image", () => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    renderSheet();

    const img = screen.getByAltText(TEST_FILE_RECORD_WITH_RENDER.fileName);
    const stopPropagation = vi.fn();
    const event = new MouseEvent("pointerdown", { bubbles: true });
    event.stopPropagation = stopPropagation;
    fireEvent(img, event);
    expect(stopPropagation).toHaveBeenCalledOnce();
  });
});
