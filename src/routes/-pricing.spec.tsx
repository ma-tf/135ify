import { PricingPage } from "@features/pricing/pricing-page";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockUseAction, mockConfig, mockPlans } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseAction: vi.fn(),
  mockConfig: {
    FEATURE_SUBSCRIPTIONS: true,
  },
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
  get FEATURE_SUBSCRIPTIONS() {
    return mockConfig.FEATURE_SUBSCRIPTIONS;
  },
  FEATURE_AI_GRAIN: false,
  FEATURE_SIGN_IN: true,
  BASE_PATH: "",
  PLANS: mockPlans,
  getPlan: (key: string) => mockPlans.find((p: any) => p.key === key),
}));

vi.mock("convex/react", () => ({
  useAction: () => mockUseAction,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    stripe: { createCheckoutSession: "createCheckoutSession" },
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
  CheckIcon: () => <span data-testid="check-icon" />,
  Loader2: ({ className }: any) => <span data-testid="loader" className={className} />,
}));

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ status: "success", data: [] });
    mockUseAction.mockResolvedValue({ url: "https://checkout.stripe.com/session_123" });
  });

  it("renders plan cards", () => {
    render(<PricingPage />);
    expect(screen.getByText("Storage")).toBeDefined();
    expect(screen.getByText("AI Generation")).toBeDefined();
  });

  it("shows Subscribe buttons for unsubscribed products", () => {
    render(<PricingPage />);
    const subscribeButtons = screen.getAllByText("Subscribe");
    expect(subscribeButtons).toHaveLength(2);
  });

  it("shows Subscribed badge for active subscriptions", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKey: "storage_paid", status: "active", _id: "s1" }],
    });
    render(<PricingPage />);
    const subscribedElements = screen.getAllByText("Subscribed");
    expect(subscribedElements.length).toBeGreaterThanOrEqual(1);
    const subscribeButtons = screen.getAllByText("Subscribe");
    expect(subscribeButtons).toHaveLength(1);
  });

  it("calls createCheckoutSession with correct priceId on Subscribe click", () => {
    render(<PricingPage />);
    const subscribeButtons = screen.getAllByText("Subscribe");
    fireEvent.click(subscribeButtons[0]);
    expect(mockUseAction).toHaveBeenCalledWith({ priceId: "price_storage_123" });
  });
});
