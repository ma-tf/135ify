import { describe, expect, it, vi } from "vite-plus/test";

const { mockUseConvexAuth, mockConfig } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockConfig: { FEATURE_SIGN_IN: true },
}));

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: mockUseConvexAuth,
}));

vi.mock("@config", () => ({
  get FEATURE_SIGN_IN() {
    return mockConfig.FEATURE_SIGN_IN;
  },
}));

import { useAuth } from "@hooks/use-auth";

describe("useAuth", () => {
  it("returns isAuthenticated true when user is signed in", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    const result = useAuth();

    expect(result.isAuthenticated).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it("returns isAuthenticated false when not signed in", () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    const result = useAuth();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
  });

  it("returns isAuthenticated false when FEATURE_SIGN_IN is disabled", () => {
    mockConfig.FEATURE_SIGN_IN = false;

    const result = useAuth();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);

    mockConfig.FEATURE_SIGN_IN = true;
  });

  it("returns fallback when useConvexAuth returns null", () => {
    mockUseConvexAuth.mockReturnValue(null);

    const result = useAuth();

    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
  });
});
