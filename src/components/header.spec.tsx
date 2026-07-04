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
  BASE_PATH: "",
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: any) => (
    <a href={to}>{typeof children === "function" ? children({ isActive: false }) : children}</a>
  ),
}));

setupTests();

describe("Header", () => {
  it("hides nav links when user is not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<Header />);

    expect(screen.queryByRole("link", { name: /film strip/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /gallery/i })).toBeNull();
  });

  it("shows both Film Strip and Gallery links when authenticated", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<Header />);

    expect(screen.getByRole("link", { name: /film strip/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /gallery/i })).toBeDefined();
  });
});
