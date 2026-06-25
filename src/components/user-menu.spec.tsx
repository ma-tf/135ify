import { setupTests } from "@test-utils/setup.spec";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import { UserMenu } from "./user-menu";

const { mockUseConvexAuth, mockUseQuery } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: mockUseConvexAuth,
  useQuery_experimental: mockUseQuery,
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
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
  DropdownMenuItem: ({ children, asChild }: any) =>
    asChild ? <>{children}</> : <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock("radix-ui", async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

setupTests();

describe("UserMenu", () => {
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
});
