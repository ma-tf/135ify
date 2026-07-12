import { PricingPage } from "@features/pricing/pricing-page";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockUseAction, mockConfig } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseAction: vi.fn(),
  mockConfig: {
    FEATURE_SUBSCRIPTIONS: true,
    STRIPE_STORAGE_PRICE_ID: "price_storage_123",
    STRIPE_AI_PRICE_ID: "price_ai_456",
  },
}));

vi.mock("@config", () => ({
  get FEATURE_SUBSCRIPTIONS() {
    return mockConfig.FEATURE_SUBSCRIPTIONS;
  },
  get STRIPE_STORAGE_PRICE_ID() {
    return mockConfig.STRIPE_STORAGE_PRICE_ID;
  },
  get STRIPE_AI_PRICE_ID() {
    return mockConfig.STRIPE_AI_PRICE_ID;
  },
  FEATURE_AI_GRAIN: false,
  FEATURE_SIGN_IN: true,
  BASE_PATH: "",
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
