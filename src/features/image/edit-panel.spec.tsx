import { EditPanel } from "@features/image/edit-panel";
import { EditViewCloseProvider } from "@features/image/edit-view-close-context";
import { EditViewProvider } from "@features/image/edit-view-context";
import { FileProvider } from "@providers/file-context";
import { useFileStore } from "@stores/file-store";
import { DEFAULT_PARAMS } from "@stores/file-store-types";
import { setupTests } from "@test-utils/setup.spec";
import { TEST_FILE_RECORD_PHOTO } from "@test-utils/test-fixtures.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const {
  mockUseAuth,
  mockUseLocation,
  mockUseAiProviderStore,
  mockConfig,
  mockToast,
  mockParamSliderCalls,
  mockFilmSelectorProps,
} = vi.hoisted(() => {
  const calls: Array<{ label: string; onValueChange: (v: number) => void }> = [];
  return {
    mockUseAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
    mockUseLocation: vi.fn(() => ({ pathname: "/" })),
    mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
    mockConfig: { FEATURE_AI_GRAIN: true, FEATURE_SUBSCRIPTIONS: false },
    mockToast: { success: vi.fn(), error: vi.fn() },
    mockParamSliderCalls: calls,
    mockFilmSelectorProps: {
      current: null as { value: string; onValueChange: (v: string) => void } | null,
    },
  };
});

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
  useQuery_experimental: (args: any) => {
    if (args.query === "subscriptions.byUser") {
      return { status: "success", data: [] };
    }
    if (args.query === "aiGenerationJobs.getAiUsage") {
      return { status: "success", data: null };
    }
    return {
      status: "success",
      data: {
        imageCount: 0,
        imageLimit: 10,
        atLimit: false,
        usedBytes: 0,
        storageLimitBytes: 52428800,
      },
    };
  },
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

vi.mock("@providers/storage-context", () => ({
  useStorage: () => ({
    removeFile: (id: string) => {
      useFileStore.setState((s) => ({ files: s.files.filter((f) => f.id !== id) }));
    },
  }),
}));

vi.mock("@providers/file-context", () => ({
  FileProvider: ({ children }: any) => <>{children}</>,
  useFile: () => TEST_FILE_RECORD_PHOTO,
}));

vi.mock("@config", () => ({
  get FEATURE_AI_GRAIN() {
    return mockConfig.FEATURE_AI_GRAIN;
  },
  get FEATURE_SUBSCRIPTIONS() {
    return mockConfig.FEATURE_SUBSCRIPTIONS;
  },
  GALLERY_IMAGE_LIMIT: 10,
  FILE_SIZE_LIMIT_BYTES: 5 * 1024 * 1024,
  GRAIN_URL: "",
  BASE_PATH: "",
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    images: { getStorageUsage: "getStorageUsage", getById: "getById" },
    subscriptions: { byUser: "subscriptions.byUser" },
    aiGenerationJobs: { getAiUsage: "aiGenerationJobs.getAiUsage", createJob: "createJob" },
    aiGenerationJobsActions: { processJob: "processJob" },
    lib: { generateUploadUrl: "generateUploadUrl" },
  },
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
  FilmSelector: vi.fn((props: any) => {
    mockFilmSelectorProps.current = props;
    return <div>Film</div>;
  }),
}));

vi.mock("@features/image/parameter-slider", () => ({
  ParameterSlider: vi.fn(({ label, onValueChange }: any) => {
    mockParamSliderCalls.push({ label, onValueChange });
    return <div data-testid="parameter-slider" data-label={label} />;
  }),
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
    <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
      <EditViewCloseProvider onClose={vi.fn()}>
        <EditViewProvider>
          <EditPanel />
        </EditViewProvider>
      </EditViewCloseProvider>
    </FileProvider>,
  );
}

describe("EditPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParamSliderCalls.length = 0;
    mockFilmSelectorProps.current = null;
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

    await Promise.resolve();

    expect(mockDownloadFullSize).toHaveBeenCalledOnce();
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
      <FileProvider fileId={TEST_FILE_RECORD_PHOTO.id}>
        <EditViewCloseProvider onClose={onClose}>
          <EditViewProvider>
            <EditPanel />
          </EditViewProvider>
        </EditViewCloseProvider>
      </FileProvider>,
    );

    fireEvent.click(screen.getByText("Delete"));

    expect(
      useFileStore.getState().files.find((f) => f.id === TEST_FILE_RECORD_PHOTO.id),
    ).toBeUndefined();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clicking ISO preset calls setParam with correct intensity", () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("400"));
    expect(mockSetParam).toHaveBeenCalledWith({ grainIntensity: 75 });
  });

  it("clicking a different ISO preset calls setParam with different intensity", () => {
    renderEditPanel();
    fireEvent.click(screen.getByText("200"));
    expect(mockSetParam).toHaveBeenCalledWith({ grainIntensity: 50 });
  });

  it("toggles Original/Processed buttons and applies active class", () => {
    renderEditPanel();

    const processedBtn = screen.getByText("Processed");
    fireEvent.click(processedBtn);

    expect(processedBtn.className).toContain("bg-background");
  });

  it("switches active state between Original and Processed", () => {
    renderEditPanel();

    const originalBtn = screen.getByText("Original");
    const processedBtn = screen.getByText("Processed");

    fireEvent.click(originalBtn);
    expect(originalBtn.className).toContain("bg-background");
    expect(processedBtn.className).not.toContain("bg-background");

    fireEvent.click(processedBtn);
    expect(processedBtn.className).toContain("bg-background");
    expect(originalBtn.className).not.toContain("bg-background");
  });

  describe("ParameterSlider wiring", () => {
    it("renders 5 parameter sliders", () => {
      renderEditPanel();
      expect(screen.getAllByTestId("parameter-slider")).toHaveLength(5);
    });

    it("halation intensity slider calls setParam", () => {
      renderEditPanel();
      mockParamSliderCalls[0].onValueChange(42);
      expect(mockSetParam).toHaveBeenCalledWith({ halationIntensity: 42 });
    });

    it("halation spread slider calls setParam", () => {
      renderEditPanel();
      mockParamSliderCalls[1].onValueChange(55);
      expect(mockSetParam).toHaveBeenCalledWith({ halationSpread: 55 });
    });

    it("halation threshold slider calls setParam", () => {
      renderEditPanel();
      mockParamSliderCalls[2].onValueChange(30);
      expect(mockSetParam).toHaveBeenCalledWith({ halationThreshold: 30 });
    });

    it("vignette intensity slider calls setParam", () => {
      renderEditPanel();
      mockParamSliderCalls[3].onValueChange(70);
      expect(mockSetParam).toHaveBeenCalledWith({ vignetteIntensity: 70 });
    });

    it("vignette feather slider calls setParam", () => {
      renderEditPanel();
      mockParamSliderCalls[4].onValueChange(80);
      expect(mockSetParam).toHaveBeenCalledWith({ vignetteFeather: 80 });
    });
  });

  describe("FilmSelector wiring", () => {
    it("passes selectedFilmId as value to FilmSelector", () => {
      renderEditPanel();
      expect(mockFilmSelectorProps.current?.value).toBe("none");
    });

    it("calls setParam on film selection", () => {
      renderEditPanel();
      mockFilmSelectorProps.current?.onValueChange("gold");
      expect(mockSetParam).toHaveBeenCalledWith({ selectedFilmId: "gold" });
    });
  });
});
