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
    entitlements: { byUser: "entitlements.byUser" },
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
  CircleAlert: () => <span data-testid="circle-alert" />,
  Loader2: ({ className }: any) => <span data-testid="loader" className={className} />,
}));

let locationHref = "";

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationHref = "";
    vi.stubGlobal("location", {
      get href() {
        return locationHref;
      },
      set href(v: string) {
        locationHref = v;
      },
    });
    mockUseQuery.mockImplementation(({ query }: any) => {
      if (query === "subscriptions.byUser") return { status: "success", data: [] };
      return { status: "success", data: { lookupKeys: [] } };
    });
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
    mockUseQuery.mockImplementation(({ query }: any) => {
      if (query === "subscriptions.byUser") return { status: "success", data: [] };
      return { status: "success", data: { lookupKeys: ["storage_paid"] } };
    });
    render(<PricingPage />);
    await vi.waitFor(() => {
      const subscribedElements = screen.getAllByText("Subscribed");
      expect(subscribedElements.length).toBeGreaterThanOrEqual(1);
    });
    const addToPlanButtons = screen.getAllByText("Add to my plan");
    expect(addToPlanButtons).toHaveLength(1);
  });

  it("calls createCheckoutSession with correct productKey on Subscribe click", async () => {
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getAllByText("Subscribe").length).toBeGreaterThanOrEqual(1);
    });
    fireEvent.click(screen.getAllByText("Subscribe")[0]);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      productKey: "storage_paid",
    });
  });

  it("renders PricingError when getPlan fails", async () => {
    mockGetPlan.mockRejectedValue(new Error("Network error"));
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getByText("Failed to load plans")).toBeDefined();
    });
  });

  it("navigates to checkout URL on Subscribe click", async () => {
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getAllByText("Subscribe").length).toBeGreaterThanOrEqual(1);
    });
    fireEvent.click(screen.getAllByText("Subscribe")[0]);
    await vi.waitFor(() => {
      expect(locationHref).toBe("https://checkout.stripe.com/session_123");
    });
  });

  it("does not redirect when checkout returns no URL", async () => {
    mockCreateCheckoutSession.mockResolvedValue({});
    render(<PricingPage />);
    await vi.waitFor(() => {
      expect(screen.getAllByText("Subscribe").length).toBeGreaterThanOrEqual(1);
    });
    fireEvent.click(screen.getAllByText("Subscribe")[0]);
    await vi.waitFor(() => {
      const subscribeBtns = screen.getAllByText("Subscribe");
      expect(subscribeBtns.length).toBeGreaterThanOrEqual(1);
    });
  });
});
