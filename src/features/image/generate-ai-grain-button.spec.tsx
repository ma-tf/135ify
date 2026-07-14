import { GenerateAiGrainButton } from "@features/image/generate-ai-grain-button";
import { setupTests } from "@test-utils/setup.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseAuth, mockUseAiProviderStore, mockConfig, mockUseAiGrainGeneration, mockUseQuery } =
  vi.hoisted((): any => ({
    mockUseAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
    mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
    mockConfig: { FEATURE_AI_GRAIN: true, FEATURE_SUBSCRIPTIONS: false },
    mockUseAiGrainGeneration: vi.fn(() => ({
      trigger: vi.fn().mockResolvedValue(undefined),
      isGenerating: false,
      errorState: null,
    })),
    mockUseQuery: vi.fn(),
  }));

let mockAiSubscriptions: any = { status: "success", data: [] };
let mockAiUsage: any = { status: "success", data: null };

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
  get FEATURE_SUBSCRIPTIONS() {
    return mockConfig.FEATURE_SUBSCRIPTIONS;
  },
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: (args: any) => {
    if (args.query === "getStorageUsage") {
      return mockUseQuery();
    }
    if (args.query === "subscriptions.byUser") {
      return mockAiSubscriptions;
    }
    if (args.query === "aiGenerationJobs.getAiUsage") {
      return mockAiUsage;
    }
    return { status: "pending" };
  },
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    images: { getStorageUsage: "getStorageUsage" },
    subscriptions: { byUser: "subscriptions.byUser" },
    aiGenerationJobs: { getAiUsage: "aiGenerationJobs.getAiUsage" },
  },
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
    mockConfig.FEATURE_SUBSCRIPTIONS = false;
    mockAiSubscriptions = { status: "success", data: [] };
    mockAiUsage = { status: "success", data: null };
    mockUseAiGrainGeneration.mockReturnValue({
      trigger: vi.fn().mockResolvedValue(undefined),
      isGenerating: false,
      errorState: null,
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

  describe("subscriber fast-path", () => {
    beforeEach(() => {
      mockConfig.FEATURE_SUBSCRIPTIONS = true;
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    });

    it("skips key dialog for AI subscribers and calls trigger without apiKey", async () => {
      const trigger = vi.fn().mockResolvedValue(undefined);
      mockUseAiGrainGeneration.mockReturnValue({ trigger, isGenerating: false });
      mockUseAiProviderStore.mockReturnValue({ apiKey: "" });
      mockAiSubscriptions = {
        status: "success",
        data: [{ productKey: "ai_generation_platform", status: "active" }],
      };

      render(<GenerateAiGrainButton showOriginal={false} />);

      fireEvent.click(screen.getByText("Generate AI Film Grain"));

      await Promise.resolve();

      expect(screen.queryByTestId("ai-key-dialog")).toBeNull();
      expect(trigger).toHaveBeenCalledWith(undefined, false);
    });

    it("disables button when at AI cost cap", () => {
      mockUseAiProviderStore.mockReturnValue({ apiKey: "" });
      mockAiSubscriptions = {
        status: "success",
        data: [{ productKey: "ai_generation_platform", status: "active" }],
      };
      mockAiUsage = {
        status: "success",
        data: { usedCents: 200, limitCents: 200, atLimit: true, resetsAt: 1700000000000 },
      };

      render(<GenerateAiGrainButton showOriginal={false} />);

      const button = screen.getByRole("button", { name: /generate ai film grain/i });
      expect(button.hasAttribute("disabled")).toBe(true);
    });

    it("still shows key dialog for non-subscribers when FEATURE_SUBSCRIPTIONS is true", () => {
      mockUseAiProviderStore.mockReturnValue({ apiKey: "" });
      mockAiSubscriptions = { status: "success", data: [] };

      render(<GenerateAiGrainButton showOriginal={false} />);

      fireEvent.click(screen.getByText("Generate AI Film Grain"));

      expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
    });
  });

  describe("abuse prevention", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
      mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    });

    it("disables button when rate-limited", () => {
      mockUseAiGrainGeneration.mockReturnValue({
        trigger: vi.fn().mockResolvedValue(undefined),
        isGenerating: false,
        errorState: { kind: "rateLimited" },
      });

      render(<GenerateAiGrainButton showOriginal={false} />);

      const button = screen.getByRole("button", { name: /generate ai film grain/i });
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(button.getAttribute("title")).toBe("Generation rate limited. Try again soon.");
    });

    it("disables button when suspended", () => {
      mockUseAiGrainGeneration.mockReturnValue({
        trigger: vi.fn().mockResolvedValue(undefined),
        isGenerating: false,
        errorState: { kind: "suspended", reason: "Abuse detected." },
      });

      render(<GenerateAiGrainButton showOriginal={false} />);

      const button = screen.getByRole("button", { name: /generate ai film grain/i });
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(button.getAttribute("title")).toBe("Abuse detected.");
    });
  });
});
