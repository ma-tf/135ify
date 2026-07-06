import { GenerateAiGrainButton } from "@features/image/generate-ai-grain-button";
import { TEST_FILE_RECORD_PHOTO } from "@test-utils/test-fixtures.spec";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseAuth, mockUseAction, mockUseAiProviderStore, mockConfig, mockToast } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
    mockUseAction: vi.fn(),
    mockUseAiProviderStore: vi.fn(() => ({ apiKey: "" })),
    mockConfig: { FEATURE_AI_GRAIN: true },
    mockToast: { success: vi.fn(), error: vi.fn() },
  }),
);

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("convex/react", () => ({
  useAction: mockUseAction,
}));

vi.mock("@hooks/use-auth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@providers/file-context", () => ({
  useFile: () => TEST_FILE_RECORD_PHOTO,
}));

vi.mock("@config", () => ({
  get FEATURE_AI_GRAIN() {
    return mockConfig.FEATURE_AI_GRAIN;
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

vi.mock("@components/over-quota-dialog", () => ({
  OverQuotaDialog: () => <div data-testid="over-quota-dialog" />,
}));

describe("Generate AI Film Grain button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.FEATURE_AI_GRAIN = true;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders when authenticated and feature flag enabled", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });

    render(<GenerateAiGrainButton context="gallery" />);

    expect(screen.getByText("Generate AI Film Grain")).toBeDefined();
  });

  it("does not render when FEATURE_AI_GRAIN is false", () => {
    mockConfig.FEATURE_AI_GRAIN = false;
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<GenerateAiGrainButton context="gallery" />);

    expect(screen.queryByText("Generate AI Film Grain")).toBeNull();
  });

  it("does not render when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<GenerateAiGrainButton context="gallery" />);

    expect(screen.queryByText("Generate AI Film Grain")).toBeNull();
  });

  it("disables button and shows spinner while generating", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    mockUseAction.mockReturnValue(vi.fn(() => new Promise(() => {})));

    render(<GenerateAiGrainButton context="gallery" />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    const button = screen.getByRole("button", { name: /generate ai film grain/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("opens AiKeyDialog when clicked with no API key", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "" });

    render(<GenerateAiGrainButton context="gallery" />);

    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
  });

  it("calls useAction with correct arguments when API key is set", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    const mockGenerate = vi.fn().mockResolvedValue({ status: "stored", takeId: "take-1" });
    mockUseAction.mockReturnValue(mockGenerate);

    render(<GenerateAiGrainButton context="gallery" />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await vi.waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({
        sourceImageId: TEST_FILE_RECORD_PHOTO.id,
        apiKey: "sk-test",
      });
    });
  });

  it("shows success toast with link to /takes on stored result", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    const mockGenerate = vi.fn().mockResolvedValue({ status: "stored", takeId: "take-1" });
    mockUseAction.mockReturnValue(mockGenerate);

    render(<GenerateAiGrainButton context="gallery" />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await vi.waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });

    const successArg = mockToast.success.mock.calls[0][0];
    const linkEl = successArg.props.children[1];
    expect(linkEl.props.to).toBe("/takes");
  });

  it("shows error toast when action rejects", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    const mockGenerate = vi.fn().mockRejectedValue(new Error("API error"));
    mockUseAction.mockReturnValue(mockGenerate);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<GenerateAiGrainButton context="gallery" />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await vi.waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("AI generation failed");
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("renders OverQuotaDialog on over-quota result", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    const mockGenerate = vi
      .fn()
      .mockResolvedValue({ status: "overQuota", base64: "dGVzdC1iYXNlNjQ" });
    mockUseAction.mockReturnValue(mockGenerate);

    render(<GenerateAiGrainButton context="gallery" />);

    expect(screen.queryByTestId("over-quota-dialog")).toBeNull();

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("over-quota-dialog")).toBeDefined();
    });
  });

  it("closes OverQuotaDialog when discarded", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseAiProviderStore.mockReturnValue({ apiKey: "sk-test" });
    const mockGenerate = vi
      .fn()
      .mockResolvedValue({ status: "overQuota", base64: "dGVzdC1iYXNlNjQ" });
    mockUseAction.mockReturnValue(mockGenerate);

    render(<GenerateAiGrainButton context="gallery" />);

    fireEvent.click(screen.getByText("Generate AI Film Grain"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("over-quota-dialog")).toBeDefined();
    });

    expect(mockGenerate).toHaveBeenCalledOnce();
  });
});
