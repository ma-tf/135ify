import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import { Header } from "./header";

const { mockUseConvexAuth } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
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
  BASE_PATH: "/",
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

setupTests();

describe("Header", () => {
  it("shows Gallery link when user is authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<Header />);

    expect(screen.getByRole("link", { name: /gallery/i })).toBeDefined();
  });

  it("hides Gallery link when user is not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<Header />);

    expect(screen.queryByRole("link", { name: /gallery/i })).toBeNull();
  });
});
