import { AccountPage } from "@features/account/account-page";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

setupTests();

const { mockUseQuery, mockUseAction } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseAction: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useAction: () => mockUseAction,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    stripe: { createPortalSession: "createPortalSession" },
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
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ status: "success", data: [] });
    mockUseAction.mockResolvedValue({ url: "https://billing.stripe.com/session_123" });
  });

  it("shows empty state when user has no subscriptions", () => {
    render(<AccountPage />);
    expect(screen.getByText("No active subscriptions")).toBeDefined();
    expect(screen.getByText("View plans")).toBeDefined();
  });

  it("renders active subscriptions", () => {
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
    expect(screen.getByText("Storage")).toBeDefined();
    expect(screen.getByText("active")).toBeDefined();
  });

  it("shows Manage Subscription button when subscriptions exist", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });
    render(<AccountPage />);
    expect(screen.getByText("Manage Subscription")).toBeDefined();
  });

  it("hides Manage Subscription button when no active subscriptions", () => {
    render(<AccountPage />);
    expect(screen.queryByText("Manage Subscription")).toBeNull();
  });

  it("calls createPortalSession on Manage Subscription click", () => {
    mockUseQuery.mockReturnValue({
      status: "success",
      data: [{ _id: "sub1", productKey: "storage_paid", status: "active" }],
    });
    render(<AccountPage />);
    fireEvent.click(screen.getByText("Manage Subscription"));
    expect(mockUseAction).toHaveBeenCalledWith({});
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
    mockUseAction.mockReturnValue(new Promise(() => {}));
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
});
