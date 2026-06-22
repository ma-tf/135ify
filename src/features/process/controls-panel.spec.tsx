import { EditPanel } from "@features/process/controls-panel";
import { FileProvider } from "@features/process/file-context";
import * as useProcessImageModule from "@features/process/use-process-image";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_PHOTO } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const mockSetParam = vi.fn();
const mockDownloadFullSize = vi.fn();

function mockUseFileProcessing(
  overrides: Partial<ReturnType<typeof useProcessImageModule.useFileProcessing>> = {},
) {
  return {
    params: TEST_FILE_PHOTO.params,
    setParam: mockSetParam,
    downloadFullSize: mockDownloadFullSize,
    ...overrides,
  };
}

function renderEditPanel() {
  useFileStore.setState({ files: [TEST_FILE_PHOTO] });
  useEditSheetStore.setState({
    openSheetId: TEST_FILE_PHOTO.id,
    imageSrc: TEST_FILE_PHOTO.renderUrl ?? "",
    showOriginal: {},
    inspectUrl: null,
  });

  return render(
    <TestStorageProvider>
      <FileProvider fileId={TEST_FILE_PHOTO.id}>
        <EditPanel />
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("EditPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useProcessImageModule, "useFileProcessing").mockReturnValue(mockUseFileProcessing());
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

  it("reset handler calls revokeFileUrls, setParam, setImageSrc, setFiles", () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("Reset"));

    expect(mockSetParam).toHaveBeenCalledWith(DEFAULT_PARAMS);
    expect(useFileStore.getState().files[0].renderUrl).toBeNull();
  });

  it("download handler creates anchor and clicks it", async () => {
    const blobUrl = "blob:download-url";
    mockDownloadFullSize.mockResolvedValue(blobUrl);

    renderEditPanel();
    fireEvent.click(screen.getByText("Download"));

    await vi.waitFor(() => {
      expect(mockDownloadFullSize).toHaveBeenCalled();
    });
  });

  it("download handler revokes URL when FEATURE_3D_PHOTO is false", async () => {
    const blobUrl = "blob:download-url";
    mockDownloadFullSize.mockResolvedValue(blobUrl);
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revokeSpy });

    renderEditPanel();
    fireEvent.click(screen.getByText("Download"));

    await vi.waitFor(() => {
      expect(mockDownloadFullSize).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith(blobUrl);
    });

    vi.unstubAllGlobals();
  });

  it("renders Halation, Vignette, and Grain section headings", () => {
    renderEditPanel();
    expect(screen.getByText("Halation")).toBeDefined();
    expect(screen.getByText("Vignette")).toBeDefined();
    expect(screen.getByText("Grain")).toBeDefined();
  });

  it("delete handler revokes URLs, removes file, and closes sheet", () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("Delete"));

    expect(useFileStore.getState().files).toHaveLength(0);
    expect(useEditSheetStore.getState().openSheetId).toBeNull();
  });
});
