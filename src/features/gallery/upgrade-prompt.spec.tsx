import { UpgradePrompt } from "@features/gallery/upgrade-prompt";
import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockConfig } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockConfig: { FEATURE_SUBSCRIPTIONS: true },
}));

vi.mock("@config", () => ({
  get FEATURE_SUBSCRIPTIONS() {
    return mockConfig.FEATURE_SUBSCRIPTIONS;
  },
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    images: { getStorageUsage: "getStorageUsage" },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@components/ui/button", () => ({
  Button: ({ children, className }: any) => (
    <button className={className} type="button">
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  CrownIcon: () => <span data-testid="crown-icon" />,
}));

describe("UpgradePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when user is at limit on free tier", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { atLimit: true, tier: "free" },
    });
    render(<UpgradePrompt />);
    expect(screen.getByText(/reached the free-tier limit/i)).toBeDefined();
    expect(screen.getByText("Upgrade")).toBeDefined();
  });

  it("does not render when not at limit", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { atLimit: false, tier: "free" },
    });
    const { container } = render(<UpgradePrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when at limit but on paid tier", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { atLimit: true, tier: "paid" },
    });
    const { container } = render(<UpgradePrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render while usage query is loading", () => {
    mockUseQuery.mockReturnValue({ status: "pending" });
    const { container } = render(<UpgradePrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when usage query errors", () => {
    mockUseQuery.mockReturnValue({ status: "error", error: new Error("fail") });
    const { container } = render(<UpgradePrompt />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when FEATURE_SUBSCRIPTIONS is disabled", () => {
    mockConfig.FEATURE_SUBSCRIPTIONS = false;
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { atLimit: true, tier: "free" },
    });
    const { container } = render(<UpgradePrompt />);
    expect(container.innerHTML).toBe("");
  });
});
