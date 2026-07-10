import { Header } from "@components/header";
import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseQuery, mockUseTakesNotificationStore, mockUseLocation, mockUseConvexAuth } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockUseTakesNotificationStore: vi.fn(),
    mockUseLocation: vi.fn(),
    mockUseConvexAuth: vi.fn(),
  }));

vi.mock("@convex/_generated/api", () => ({
  api: { aiGenerationJobs: { latestJobTimestamp: "latestJobTimestamp" } },
}));

vi.mock("@stores/takes-notification-store", () => ({
  useTakesNotificationStore: mockUseTakesNotificationStore,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: mockUseConvexAuth,
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@components/mode-toggle", () => ({
  ModeToggle: () => <div>Toggle theme</div>,
}));

vi.mock("@components/sign-in-dialog", () => ({
  SignInButtons: () => null,
}));

vi.mock("@components/user-menu", () => ({
  UserMenu: () => null,
}));

vi.mock("@config", () => ({
  FEATURE_SIGN_IN: true,
  BASE_PATH: "",
}));

vi.mock("convex/react", () => ({
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: any) => (
    <a href={to}>{typeof children === "function" ? children({ isActive: false }) : children}</a>
  ),
  useLocation: mockUseLocation,
}));

setupTests();

describe("Header", () => {
  beforeEach(() => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseLocation.mockReturnValue({ pathname: "/gallery" });
    mockUseTakesNotificationStore.mockReturnValue({ lastSeenAt: null, markSeen: vi.fn() });
    mockUseQuery.mockReturnValue({ status: "success", data: null });
  });

  it("hides nav links when user is not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<Header />);

    expect(screen.queryByRole("link", { name: /film strip/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /gallery/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /takes/i })).toBeNull();
  });

  it("shows Film Strip, Gallery, and Takes links when authenticated", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /film strip/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /gallery/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /takes/i })).toBeDefined();
  });

  it("shows notification dot when latest take is newer than lastSeenAt", () => {
    mockUseQuery.mockReturnValue({ status: "success", data: { _creationTime: 200 } });

    render(<Header />);

    const takesLink = screen.getByRole("link", { name: /takes/i });
    expect(takesLink.querySelector(".rounded-full")).toBeDefined();
  });

  it("hides notification dot when on /takes page", () => {
    mockUseLocation.mockReturnValue({ pathname: "/takes" });
    mockUseQuery.mockReturnValue({ status: "success", data: { _creationTime: 200 } });

    render(<Header />);

    const takesLink = screen.getByRole("link", { name: /takes/i });
    expect(takesLink.querySelector(".rounded-full")).toBeNull();
  });

  it("hides notification dot when no takes exist", () => {
    render(<Header />);

    const takesLink = screen.getByRole("link", { name: /takes/i });
    expect(takesLink.querySelector(".rounded-full")).toBeNull();
  });

  it("hides notification dot when lastSeenAt is after latest take", () => {
    mockUseTakesNotificationStore.mockReturnValue({ lastSeenAt: 300, markSeen: vi.fn() });
    mockUseQuery.mockReturnValue({ status: "success", data: { _creationTime: 200 } });

    render(<Header />);

    const takesLink = screen.getByRole("link", { name: /takes/i });
    expect(takesLink.querySelector(".rounded-full")).toBeNull();
  });
});
