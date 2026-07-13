import { PricingPage } from "@features/pricing/pricing-page";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockGetPlan, mockCreateCheckoutSession, mockPlans } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockGetPlan: vi.fn(),
  mockCreateCheckoutSession: vi.fn(),
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
  FEATURE_AI_GRAIN: false,
  FEATURE_SIGN_IN: true,
  BASE_PATH: "",
  getPlan: (plans: any[], key: string) => plans.find((p) => p.key === key),
}));

vi.mock("convex/react", () => ({
  useAction: (ref: any) => {
    if (ref === "getPlan") return mockGetPlan;
    return mockCreateCheckoutSession;
  },
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    stripe: {
      createCheckoutSession: "createCheckoutSession",
      getPlan: "getPlan",
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
  CheckIcon: () => <span data-testid="check-icon" />,
  Loader2: ({ className }: any) => <span data-testid="loader" className={className} />,
}));

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ status: "success", data: [] });
    mockGetPlan.mockResolvedValue(mockPlans);
    mockCreateCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });
  });

  it("renders plan cards", async () => {
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Storage")).toBeDefined();
    });
    expect(screen.getByText("AI Generation")).toBeDefined();
  });

  it("shows Subscribe buttons for unsubscribed products", async () => {
    render(<PricingPage />);
    await vi.waitFor(() => {
      const subscribeButtons = screen.getAllByText("Subscribe");
      expect(subscribeButtons).toHaveLength(2);
    });
  });

  it("shows Subscribed badge for active subscriptions", async () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ productKey: "storage_paid", status: "active", _id: "s1" }],
    });
    render(<PricingPage />);
    await vi.waitFor(() => {
      const subscribedElements = screen.getAllByText("Subscribed");
      expect(subscribedElements.length).toBeGreaterThanOrEqual(1);
    });
    const subscribeButtons = screen.getAllByText("Subscribe");
    expect(subscribeButtons).toHaveLength(1);
  });

  it("calls createCheckoutSession with correct priceId on Subscribe click", async () => {
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getAllByText("Subscribe").length).toBeGreaterThanOrEqual(1);
    });
    fireEvent.click(screen.getAllByText("Subscribe")[0]);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      priceId: "price_storage_123",
    });
  });
});
