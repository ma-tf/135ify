import { AccountPage } from "@features/account/account-page";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockGetPlan, mockCreatePortalSession, mockPlans, mockUseAiProviderStore } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockGetPlan: vi.fn(),
    mockCreatePortalSession: vi.fn(),
    mockUseAiProviderStore: vi.fn(),
    mockPlans: [
      {
        key: "storage_paid",
        name: "Storage",
        price: "$2/mo",
        description: "More gallery space for your 135 scans.",
        features: [
          "360 images (up from 36)",
          "25 MB per file (up from 10 MB)",
          "~9 GB total storage",
        ],
        priceId: "price_storage_123",
      },
      {
        key: "ai_generation_platform",
        name: "AI Generation",
        price: "$2/mo",
        description: "Platform-managed AI grain. No BYO key needed.",
        features: [
          "OpenAI-powered film grain generation",
          "No separate API key required",
          "Managed monthly usage allowance",
        ],
        priceId: "price_ai_456",
      },
    ],
  }));

vi.mock("@config", () => ({
  FEATURE_SUBSCRIPTIONS: true,
  FEATURE_AI_GRAIN: true,
  FEATURE_SIGN_IN: true,
  BASE_PATH: "",
  getPlan: (plans: any[], key: string) => plans.find((p) => p.key === key),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@components/ui/field", () => ({
  Field: ({ children }: any) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("@components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@stores/ai-provider-store", () => ({
  useAiProviderStore: mockUseAiProviderStore,
}));

vi.mock("convex/react", () => ({
  useAction: (ref: any) => {
    if (ref === "getPlan") return mockGetPlan;
    return mockCreatePortalSession;
  },
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    stripe: {
      getPlan: "getPlan",
      createPortalSession: "createPortalSession",
    },
    subscriptions: { byUser: "subscriptions.byUser" },
  },
}));

vi.mock("@components/ui/button", () => ({
  Button: ({ children, disabled, onClick, className }: any) => (
    <button disabled={disabled} onClick={onClick} className={className} type="button">
      {children}
    </button>
  ),
}));

vi.mock("@components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={className} />,
}));

vi.mock("lucide-react", () => ({
  ShoppingBag: () => <span data-testid="shopping-bag" />,
  Loader2: ({ className }: any) => <span data-testid="loader" className={className} />,
  EyeOffIcon: () => <span data-testid="eye-off" />,
  EyeIcon: () => <span data-testid="eye-on" />,
}));

import { toast } from "sonner";

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ status: "success", data: [] });
    mockGetPlan.mockResolvedValue(mockPlans);
    mockCreatePortalSession.mockResolvedValue({
      url: "https://billing.stripe.com/session_123",
    });
    mockUseAiProviderStore.mockReturnValue({
      apiKey: "",
      setApiKey: vi.fn(),
      clearApiKey: vi.fn(),
    });
  });

  it("shows empty state when user has no subscriptions", () => {
    render(<AccountPage />);
    expect(screen.getByText("No active subscriptions")).toBeDefined();
    expect(screen.getByText("View plans")).toBeDefined();
  });

  it("renders active subscriptions", async () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [
        {
          _id: "sub1",
          productKey: "storage_paid",
          status: "active",
          currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400 * 30,
          cancelAtPeriodEnd: false,
        },
      ],
    });
    render(<AccountPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Storage")).toBeDefined();
    });
    expect(screen.getByText("active")).toBeDefined();
  });

  it("shows Manage Subscription button when subscriptions exist", async () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });
    render(<AccountPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Manage Subscription")).toBeDefined();
    });
  });

  it("hides Manage Subscription button when no active subscriptions", () => {
    render(<AccountPage />);
    expect(screen.queryByText("Manage Subscription")).toBeNull();
  });

  it("calls createPortalSession on Manage Subscription click", async () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });
    render(<AccountPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Manage Subscription")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Manage Subscription"));
    expect(mockCreatePortalSession).toHaveBeenCalledWith({});
  });

  it("redirects to Stripe Portal URL after successful manage", async () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });

    const originalHref = window.location.href;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    render(<AccountPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Manage Subscription")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Manage Subscription"));

    await vi.waitFor(() => {
      expect(window.location.href).toBe("https://billing.stripe.com/session_123");
    });

    Object.defineProperty(window, "location", {
      value: { href: originalHref },
      writable: true,
    });
  });

  it("shows loading state while redirecting to portal", () => {
    mockCreatePortalSession.mockReturnValue(new Promise(() => {}));
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });
    render(<AccountPage />);
    fireEvent.click(screen.getByText("Manage Subscription"));
    expect(screen.getByText("Redirecting...")).toBeDefined();
  });

  it("shows error state when subscriptions fail to load", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("fail") });
    render(<AccountPage />);
    expect(screen.getByText("Failed to load subscriptions.")).toBeDefined();
  });

  describe("ApiKeyForm", () => {
    it("renders the API key form", () => {
      render(<AccountPage />);
      expect(screen.getByText("API Key")).toBeDefined();
      expect(screen.getByLabelText("OpenAI API Key")).toBeDefined();
      expect(screen.getByText("Save")).toBeDefined();
      expect(screen.getByText("Clear")).toBeDefined();
    });

    it("Save button is disabled when input is empty", () => {
      render(<AccountPage />);
      const saveButton = screen.getByText("Save");
      expect((saveButton as HTMLButtonElement).disabled).toBe(true);
    });

    it("Clear button is disabled when no key is stored", () => {
      render(<AccountPage />);
      const clearButton = screen.getByText("Clear");
      expect((clearButton as HTMLButtonElement).disabled).toBe(true);
    });

    it("Save persists the key and shows a success toast", () => {
      const setApiKey = vi.fn();
      mockUseAiProviderStore.mockReturnValue({
        apiKey: "",
        setApiKey,
        clearApiKey: vi.fn(),
      });
      render(<AccountPage />);
      const input = screen.getByLabelText("OpenAI API Key");
      fireEvent.change(input, { target: { value: "sk-new-key" } });
      fireEvent.click(screen.getByText("Save"));
      expect(setApiKey).toHaveBeenCalledWith("sk-new-key");
      expect(toast.success).toHaveBeenCalledWith("API key saved");
    });

    it("Clear removes the key and resets the input", () => {
      const clearApiKey = vi.fn();
      mockUseAiProviderStore.mockReturnValue({
        apiKey: "sk-to-clear",
        setApiKey: vi.fn(),
        clearApiKey,
      });
      render(<AccountPage />);
      fireEvent.click(screen.getByText("Clear"));
      expect(clearApiKey).toHaveBeenCalled();
      const input = screen.getByLabelText("OpenAI API Key") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });
});
