import { GenerateAiGrainButton } from "@features/image/generate-ai-grain-button";
import { setupTests } from "@test-utils/setup.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseAuth, mockUseAiProviderStore, mockConfig, mockUseAiGrainGeneration, mockUseQuery } =
  vi.hoisted(() => ({
    mockUseAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
    mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
    mockConfig: { FEATURE_AI_GRAIN: true, GALLERY_IMAGE_LIMIT: 10 },
    mockUseAiGrainGeneration: vi.fn(() => ({
      trigger: vi.fn().mockResolvedValue(undefined),
      isGenerating: false,
    })),
    mockUseQuery: vi.fn(),
  }));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@hooks/use-auth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@hooks/useAiGrainGeneration", () => ({
  useAiGrainGeneration: mockUseAiGrainGeneration,
}));

vi.mock("@config", () => ({
  get FEATURE_AI_GRAIN() {
    return mockConfig.FEATURE_AI_GRAIN;
  },
  get GALLERY_IMAGE_LIMIT() {
    return mockConfig.GALLERY_IMAGE_LIMIT;
  },
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: { images: { getStorageUsage: "getStorageUsage" } },
}));

vi.mock("@stores/ai-provider-store", () => ({
  useAiProviderStore: mockUseAiProviderStore,
}));

vi.mock("@components/ai-key-dialog", () => ({
  AiKeyDialog: ({ onSave }: any) => (
    <div data-testid="ai-key-dialog">
      <button onClick={() => onSave("sk-from-dialog")}>Save Key</button>
    </div>
  ),
}));

setupTests();

describe("Generate AI Film Grain button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.FEATURE_AI_GRAIN = true;
    mockConfig.GALLERY_IMAGE_LIMIT = 10;
    mockUseAiGrainGeneration.mockReturnValue({
      trigger: vi.fn().mockResolvedValue(undefined),
      isGenerating: false,
    });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: {
        imageCount: 0,
        imageLimit: 10,
        atLimit: false,
        usedBytes: 0,
        storageLimitBytes: 52428800,
        tier: "free",
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders when authenticated and feature flag enabled", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });

    render(<GenerateAiGrainButton showOriginal={false} />);

    expect(screen.getByText("Generate AI Film Grain")).toBeDefined();
  });

  it("does not render when FEATURE_AI_GRAIN is false", () => {
    mockConfig.FEATURE_AI_GRAIN = false;
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<GenerateAiGrainButton showOriginal={false} />);

    expect(screen.queryByText("Generate AI Film Grain")).toBeNull();
  });

  it("does not render when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<GenerateAiGrainButton showOriginal={false} />);

    expect(screen.queryByText("Generate AI Film Grain")).toBeNull();
  });

  it("disables button and shows spinner while generating", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    mockUseAiGrainGeneration.mockReturnValue({
      trigger: vi.fn(() => new Promise(() => {})),
      isGenerating: true,
    });

    render(<GenerateAiGrainButton showOriginal={false} />);

    const button = screen.getByRole("button", { name: /generate ai film grain/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("renders disabled when gallery is at image limit", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { imageCount: 10, imageLimit: 10, atLimit: true, tier: "free" },
    });

    render(<GenerateAiGrainButton showOriginal={false} />);

    const button = screen.getByRole("button", { name: /generate ai film grain/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("opens AiKeyDialog when clicked with no API key", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "" });

    render(<GenerateAiGrainButton showOriginal={false} />);

    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
  });

  it("calls trigger with apiKey when button clicked", async () => {
    const trigger = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    mockUseAiGrainGeneration.mockReturnValue({ trigger, isGenerating: false });

    render(<GenerateAiGrainButton showOriginal={false} />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await Promise.resolve();

    expect(trigger).toHaveBeenCalledWith("sk-test", false);
  });

  it("calls trigger with key from dialog when no apiKey is set", async () => {
    const trigger = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "" });
    mockUseAiGrainGeneration.mockReturnValue({ trigger, isGenerating: false });

    render(<GenerateAiGrainButton showOriginal={false} />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));
    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();

    fireEvent.click(screen.getByText("Save Key"));

    await Promise.resolve();

    expect(trigger).toHaveBeenCalledWith("sk-from-dialog", false);
  });
});
