import { Header } from "@components/header";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const {
  mockUseQuery,
  mockUseTakesNotificationStore,
  mockUseLocation,
  mockUseConvexAuth,
  mockUseTheme,
} = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseTakesNotificationStore: vi.fn(),
  mockUseLocation: vi.fn(),
  mockUseConvexAuth: vi.fn(),
  mockUseTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    aiGenerationJobs: { latestJobTimestamp: "latestJobTimestamp" },
    users: { current: "users.current" },
  },
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

vi.mock("@components/theme-provider", () => ({
  useTheme: mockUseTheme,
  ThemeProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock(import("@lib/utils"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getInitials: vi.fn(() => "?") };
});

vi.mock("@components/user-menu", () => ({
  UserMenu: () => null,
}));

vi.mock("@config", () => ({
  FEATURE_AI_GRAIN: true,
  FEATURE_SIGN_IN: true,
  FEATURE_SUBSCRIPTIONS: false,
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

vi.mock("@components/ui/popover", () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children, className }: any) => (
    <div data-testid="popover-content" className={className}>
      {children}
    </div>
  ),
}));

setupTests();

describe("Header", () => {
  beforeEach(() => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseLocation.mockReturnValue({ pathname: "/gallery" });
    mockUseTakesNotificationStore.mockReturnValue({ lastSeenAt: null, markSeen: vi.fn() });
    mockUseQuery.mockImplementation(({ query }) =>
      query === "users.current"
        ? { status: "success", data: { name: "Test", email: "test@test.com", image: "test.jpg" } }
        : { status: "success", data: null },
    );
  });

  it("hides nav links when user is not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<Header />);

    expect(screen.queryByRole("link", { name: /film strip/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /gallery/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /takes/i })).toBeNull();
  });

  it("hides theme toggle when authenticated", () => {
    render(<Header />);

    expect(screen.queryByText("Toggle theme")).toBeNull();
  });

  it("shows theme toggle when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<Header />);

    expect(screen.getByText("Toggle theme")).toBeDefined();
  });

  it("shows Film Strip, Gallery, and Takes links when authenticated", () => {
    render(<Header />);

    expect(screen.getAllByRole("link", { name: /film strip/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /gallery/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /takes/i }).length).toBeGreaterThan(0);
  });

  it("shows notification dot when latest take is newer than lastSeenAt", () => {
    mockUseQuery.mockImplementation(({ query }) =>
      query === "users.current"
        ? { status: "success", data: { name: "Test", email: "test@test.com", image: "test.jpg" } }
        : { status: "success", data: { _creationTime: 200 } },
    );

    render(<Header />);

    const takesLinks = screen.getAllByRole("link", { name: /takes/i });
    expect(takesLinks[0].querySelector(".rounded-full")).toBeDefined();
  });

  it("hides notification dot when on /takes page", () => {
    mockUseLocation.mockReturnValue({ pathname: "/takes" });
    mockUseQuery.mockImplementation(({ query }) =>
      query === "users.current"
        ? { status: "success", data: { name: "Test", email: "test@test.com", image: "test.jpg" } }
        : { status: "success", data: { _creationTime: 200 } },
    );

    render(<Header />);

    const takesLinks = screen.getAllByRole("link", { name: /takes/i });
    expect(takesLinks[0].querySelector(".rounded-full")).toBeNull();
  });

  it("hides notification dot when no takes exist", () => {
    render(<Header />);

    const takesLinks = screen.getAllByRole("link", { name: /takes/i });
    expect(takesLinks[0].querySelector(".rounded-full")).toBeNull();
  });

  it("hides notification dot when lastSeenAt is after latest take", () => {
    mockUseTakesNotificationStore.mockReturnValue({ lastSeenAt: 300, markSeen: vi.fn() });
    mockUseQuery.mockImplementation(({ query }) =>
      query === "users.current"
        ? { status: "success", data: { name: "Test", email: "test@test.com", image: "test.jpg" } }
        : { status: "success", data: { _creationTime: 200 } },
    );

    render(<Header />);

    const takesLinks = screen.getAllByRole("link", { name: /takes/i });
    expect(takesLinks[0].querySelector(".rounded-full")).toBeNull();
  });

  it("shows theme buttons in MobileNav", () => {
    render(<Header />);

    expect(screen.getByText("Light")).toBeDefined();
    expect(screen.getByText("Dark")).toBeDefined();
    expect(screen.getByText("System")).toBeDefined();
  });

  it("calls setTheme when Dark button is clicked in MobileNav", () => {
    const setTheme = vi.fn();
    mockUseTheme.mockReturnValue({ theme: "light", setTheme });

    render(<Header />);
    fireEvent.click(screen.getByText("Dark"));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("shows Sign out button in MobileNav", () => {
    render(<Header />);

    expect(screen.getByText("Sign out")).toBeDefined();
  });

  it("shows skeleton in MobileNav when user query is pending", () => {
    mockUseQuery.mockImplementation(({ query }) =>
      query === "users.current" ? { status: "pending" } : { status: "success", data: null },
    );

    render(<Header />);

    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });
});
