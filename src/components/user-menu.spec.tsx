import { UserMenu } from "@components/user-menu";
import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const { mockUseConvexAuth, mockUseQuery, mockConfig } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockUseQuery: vi.fn(),
  mockConfig: { FEATURE_AI_GRAIN: true },
}));

vi.mock("convex/react", () => ({
  useConvexAuth: mockUseConvexAuth,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@config", () => ({
  get FEATURE_AI_GRAIN() {
    return mockConfig.FEATURE_AI_GRAIN;
  },
  FEATURE_SIGN_IN: true,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
  useConvexAuth: mockUseConvexAuth,
}));

const { mockSetTheme } = vi.hoisted(() => ({ mockSetTheme: vi.fn() }));

vi.mock("@components/theme-provider", () => ({
  useTheme: () => ({ setTheme: mockSetTheme }),
}));

vi.mock("@components/ai-key-dialog", () => ({
  AiKeyDialog: () => <div data-testid="ai-key-dialog" />,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, asChild, onClick }: any) =>
    asChild ? <>{children}</> : <div onClick={onClick}>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock("radix-ui", async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

setupTests();

describe("UserMenu", () => {
  afterEach(() => {
    mockConfig.FEATURE_AI_GRAIN = true;
    mockSetTheme.mockReset();
  });

  it("renders My Images link pointing to /gallery", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    const link = screen.getByText(/gallery/i);
    expect(link.closest("a")?.getAttribute("href")).toBe("/gallery");
  });

  it("renders an API Key menu item", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    expect(screen.getByText("API Key")).toBeDefined();
  });

  it("opens the AI key dialog when API Key is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();

    fireEvent.click(screen.getByText("API Key"));

    expect(screen.getByTestId("ai-key-dialog")).toBeDefined();
  });

  it("does not render API Key item when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<UserMenu />);

    expect(screen.queryByText("API Key")).toBeNull();
  });

  it("does not render API Key item when FEATURE_AI_GRAIN is false", () => {
    mockConfig.FEATURE_AI_GRAIN = false;
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    expect(screen.queryByText("API Key")).toBeNull();
    expect(screen.queryByTestId("ai-key-dialog")).toBeNull();
  });

  it("renders Light theme item", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    expect(screen.getByText("Light")).toBeDefined();
    expect(screen.getByText("Dark")).toBeDefined();
    expect(screen.getByText("System")).toBeDefined();
  });

  it("sets theme to light when Light is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    fireEvent.click(screen.getByText("Light"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("sets theme to dark when Dark is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    fireEvent.click(screen.getByText("Dark"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("sets theme to system when System is clicked", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      status: "success",
      data: { name: "Test", image: null, email: "test@test.com" },
    });

    render(<UserMenu />);

    fireEvent.click(screen.getByText("System"));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
