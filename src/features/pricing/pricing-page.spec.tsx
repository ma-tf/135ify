import { PricingPage } from "@features/pricing/pricing-page";
import { setupTests } from "@test-utils/setup.spec";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

const { mockUseQuery, mockUseAction } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseAction: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    subscriptions: { byUser: "subscriptions.byUser" },
    stripe: {
      getPlan: "stripe.getPlan",
      createCheckoutSession: "stripe.createCheckoutSession",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
  useAction: mockUseAction,
}));

vi.mock("@components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

vi.mock("@features/pricing/plan-card", () => ({
  PlanCard: vi.fn(({ plan, subscribedKeys }: any) => (
    <div data-testid="plan-card">
      {plan.key}: {subscribedKeys.has(plan.key) ? "subscribed" : "not-subscribed"}
    </div>
  )),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

setupTests();

describe("PricingPage", () => {
  type Plan = {
    key: string;
    name: string;
    description: string;
    price: string;
    priceId: string;
    features: string[];
  };

  const proPlan: Plan = {
    key: "pro",
    name: "Pro",
    description: "Pro plan",
    price: "$10",
    priceId: "price_pro",
    features: ["Feature A"],
  };

  const basicPlan: Plan = {
    key: "basic",
    name: "Basic",
    description: "Basic plan",
    price: "$5",
    priceId: "price_basic",
    features: ["Feature B"],
  };

  function mockResolved(plans: Plan[], subs: { status: string; productKey: string }[]) {
    mockUseQuery.mockReturnValue({ status: "success", data: subs });
    mockUseAction.mockReturnValue(vi.fn().mockResolvedValue(plans));
  }

  it("includes active subscriptions in subscribedKeys", async () => {
    mockResolved([proPlan], [{ status: "active", productKey: "pro" }]);

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: subscribed")).toBeDefined();
    });
  });

  it("includes trialing subscriptions in subscribedKeys", async () => {
    mockResolved([proPlan], [{ status: "trialing", productKey: "pro" }]);

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: subscribed")).toBeDefined();
    });
  });

  it("excludes canceled subscriptions from subscribedKeys", async () => {
    mockResolved([proPlan], [{ status: "canceled", productKey: "pro" }]);

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: not-subscribed")).toBeDefined();
    });
  });

  it("handles empty subscriptions array", async () => {
    mockResolved([proPlan], []);

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: not-subscribed")).toBeDefined();
    });
  });

  it("uses empty Set when subscription query is not success", async () => {
    mockUseQuery.mockReturnValue({ status: "pending" });
    mockUseAction.mockReturnValue(vi.fn().mockResolvedValue([proPlan]));

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: not-subscribed")).toBeDefined();
    });
  });

  it("correctly distinguishes subscribed vs unsubscribed across multiple plans", async () => {
    mockResolved([basicPlan, proPlan], [{ status: "active", productKey: "pro" }]);

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText("pro: subscribed")).toBeDefined();
      expect(screen.getByText("basic: not-subscribed")).toBeDefined();
    });
  });
});
