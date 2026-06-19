import { EditPanel } from "@features/process/controls-panel";
import { FileProvider } from "@features/process/file-context";
import { DEFAULT_PARAMS } from "@features/process/process-image";
import * as useProcessImageModule from "@features/process/use-process-image";
import { useEditSheetStore } from "@stores/edit-sheet-store";
import { useFileStore, type FileWithState } from "@stores/file-store";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(cleanup);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const TEST_FILE: FileWithState = {
  file: new File(["test"], "photo.jpg", { type: "image/jpeg" }),
  id: "file-1",
  preview: "blob:preview-url",
  params: { ...DEFAULT_PARAMS, selectedFilmId: "none" },
  renderUrl: "blob:render-url",
  isProcessing: false,
  renderError: null,
};

const mockSetParam = vi.fn();
const mockDownloadFullSize = vi.fn();

function mockUseFileProcessing(
  overrides: Partial<ReturnType<typeof useProcessImageModule.useFileProcessing>> = {},
) {
  return {
    params: TEST_FILE.params,
    setParam: mockSetParam,
    downloadFullSize: mockDownloadFullSize,
    ...overrides,
  };
}

function renderEditPanel() {
  useFileStore.setState({ files: [TEST_FILE] });
  useEditSheetStore.setState({
    openSheetId: TEST_FILE.id,
    imageSrc: TEST_FILE.renderUrl ?? "",
    showOriginal: {},
    inspectUrl: null,
  });

  return render(
    <FileProvider fileId={TEST_FILE.id}>
      <EditPanel />
    </FileProvider>,
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
});
