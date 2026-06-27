import { EditViewProvider } from "@features/image/edit-view-context";
import { EditViewSheet } from "@features/image/edit-view-sheet";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_WITH_RENDER } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@features/image/controls-panel", () => ({
  EditPanel: () => <div data-testid="edit-panel" />,
}));

vi.mock("@hooks/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

import { useIsMobile } from "@hooks/use-mobile";

setupTests();

afterEach(cleanup);

function renderSheet() {
  useFileStore.setState({ files: [TEST_FILE_RECORD_WITH_RENDER] });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={TEST_FILE_RECORD_WITH_RENDER.id}>
        <EditViewProvider>
          <EditViewSheet />
        </EditViewProvider>
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("EditViewSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobile).mockReturnValue(false);
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

  it("navigates home when close button is clicked", () => {
    renderSheet();
    const closeBtn = screen.getByText("Close");
    fireEvent.click(closeBtn);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
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
});
