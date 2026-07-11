import { EditPanel } from "@features/image/edit-panel";
import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewProvider } from "@features/image/edit-view-context";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_PHOTO } from "@test-utils/test-fixtures.spec";
import { TestStorageProvider } from "@test-utils/test-storage-provider.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseAuth, mockUseLocation, mockUseAiProviderStore, mockConfig, mockToast } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
    mockUseLocation: vi.fn(() => ({ pathname: "/" })),
    mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
    mockConfig: { FEATURE_AI_GRAIN: true },
    mockToast: { success: vi.fn(), error: vi.fn() },
  }),
);

vi.mock("@features/image/use-file-processing", () => ({
  useFileProcessing: vi.fn(() => ({
    params: TEST_FILE_RECORD_PHOTO.params,
    setParam: vi.fn(),
    downloadFullSize: vi.fn(),
  })),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useLocation: mockUseLocation,
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: vi.fn(() => ({
    status: "success",
    data: {
      imageCount: 0,
      imageLimit: 10,
      atLimit: false,
      usedBytes: 0,
      storageLimitBytes: 52428800,
    },
  })),
  useMutation: vi.fn(),
}));

vi.mock("@hooks/useAiGrainGeneration", () => ({
  useAiGrainGeneration: () => ({ trigger: vi.fn(), isGenerating: false }),
}));

vi.mock("@hooks/use-auth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@features/gallery/use-save-to-gallery", () => ({
  useSaveToGallery: () => ({ save: vi.fn(), isSaving: false }),
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: () => TEST_FILE_RECORD_PHOTO,
}));

vi.mock("@config", () => ({
  get FEATURE_AI_GRAIN() {
    return mockConfig.FEATURE_AI_GRAIN;
  },
  GALLERY_IMAGE_LIMIT: 10,
  FILE_SIZE_LIMIT_BYTES: 5 * 1024 * 1024,
  GRAIN_URL: "",
  BASE_PATH: "",
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@stores/ai-provider-store", () => ({
  useAiProviderStore: mockUseAiProviderStore,
}));

vi.mock("@components/ai-key-dialog", () => ({
  AiKeyDialog: () => <div data-testid="ai-key-dialog" />,
}));

vi.mock("@features/image/film-selector", () => ({
  FilmSelector: () => <div>Film</div>,
}));

vi.mock("@features/image/parameter-slider", () => ({
  ParameterSlider: () => <div data-testid="parameter-slider" />,
}));

import { useFileProcessing } from "@features/image/use-file-processing";

setupTests();

const mockSetParam = vi.fn();
const mockDownloadFullSize = vi.fn();

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
        <EditViewCloseProvider onClose={vi.fn()}>
          <EditViewProvider>
            <EditPanel />
          </EditViewProvider>
        </EditViewCloseProvider>
      </FileProvider>
    </TestStorageProvider>,
  );
}

describe("EditPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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

  it("renders Halation, Vignette, and Grain section headings", () => {
    renderEditPanel();
    expect(screen.getByText("Halation")).toBeDefined();
    expect(screen.getByText("Vignette")).toBeDefined();
    expect(screen.getByText("Grain")).toBeDefined();
  });

  it("delete handler removes file and calls onClose", () => {
    const onClose = vi.fn();

    useFileStore.setState({ files: [TEST_FILE_RECORD_PHOTO] });
    vi.mocked(useFileProcessing).mockReturnValue({
      params: TEST_FILE_RECORD_PHOTO.params,
      setParam: mockSetParam,
      downloadFullSize: mockDownloadFullSize,
    });

    render(
      <TestStorageProvider>
        <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
          <EditViewCloseProvider onClose={onClose}>
            <EditViewProvider>
              <EditPanel />
            </EditViewProvider>
          </EditViewCloseProvider>
        </FileProvider>
      </TestStorageProvider>,
    );

    fireEvent.click(screen.getByText("Delete"));

    expect(
      useFileStore.getState().files.find((f) => f.id === TEST_FILE_RECORD_PHOTO.id),
    ).toBeUndefined();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
