import { EditPanel } from "@features/image/controls-panel";
import { EditViewProvider } from "@features/image/edit-view-context";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_PHOTO } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@features/image/use-file-processing", () => ({
  useFileProcessing: vi.fn(() => ({
    params: TEST_FILE_RECORD_PHOTO.params,
    setParam: vi.fn(),
    downloadFullSize: vi.fn(),
  })),
}));

import { useFileProcessing } from "@features/image/use-file-processing";

setupTests();

const mockSetParam = vi.fn();
const mockDownloadFullSize = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

function renderEditPanel() {
  useFileStore.setState({ files: [TEST_FILE_RECORD_PHOTO] });

  vi.mocked(useFileProcessing).mockReturnValue({
    params: TEST_FILE_RECORD_PHOTO.params,
    setParam: mockSetParam,
    downloadFullSize: mockDownloadFullSize,
  });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
        <EditViewProvider>
          <EditPanel />
        </EditViewProvider>
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("EditPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Processing heading", () => {
    renderEditPanel();
    expect(screen.getByText("Processing")).toBeDefined();
  });

  it("renders Original and Processed toggle buttons", () => {
    renderEditPanel();
    expect(screen.getByText("Original")).toBeDefined();
    expect(screen.getByText("Processed")).toBeDefined();
  });

  it("renders the FilmSelector", () => {
    renderEditPanel();
    expect(screen.getByText("Film")).toBeDefined();
  });

  it("reset handler calls setParam with DEFAULT_PARAMS", () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("Reset"));
    expect(mockSetParam).toHaveBeenCalledWith(DEFAULT_PARAMS);
  });

  it("download handler calls downloadFullSize", async () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("Download"));

    await vi.waitFor(() => {
      expect(mockDownloadFullSize).toHaveBeenCalledOnce();
    });
  });

  it("delete handler removes file and navigates home", () => {
    renderEditPanel();

    let caught: unknown;
    try {
      fireEvent.click(screen.getByText("Delete"));
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeDefined();
    expect(
      useFileStore.getState().files.find((f) => f.id === TEST_FILE_RECORD_PHOTO.id),
    ).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("renders Halation, Vignette, and Grain section headings", () => {
    renderEditPanel();
    expect(screen.getByText("Halation")).toBeDefined();
    expect(screen.getByText("Vignette")).toBeDefined();
    expect(screen.getByText("Grain")).toBeDefined();
  });
});
