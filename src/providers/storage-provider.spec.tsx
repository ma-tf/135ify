import type { ReactNode } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: vi.fn(),
}));

vi.mock("@providers/convex-storage", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="convex-storage">{children}</div>
  ),
}));

async function setupProvider(featureSignIn: boolean) {
  vi.resetModules();
  vi.doMock("@config", () => ({ FEATURE_SIGN_IN: featureSignIn }));

  const authMod = await import("@convex-dev/auth/react");
  const useConvexAuth = vi.mocked(authMod.useConvexAuth);

  const { StorageProvider } = await import("@providers/storage-provider");
  const { useStorage } = await import("@providers/storage-context");

  return { StorageProvider, useStorage, useConvexAuth };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function renderProvider(
  featureSignIn: boolean,
  authState: { isAuthenticated: boolean; isLoading: boolean },
  children: ReactNode = <div data-testid="child">child</div>,
) {
  const { StorageProvider, useConvexAuth } = await setupProvider(featureSignIn);
  useConvexAuth.mockReturnValue(authState as never);
  return render(<StorageProvider>{children}</StorageProvider>);
}

describe("StorageProvider with FEATURE_SIGN_IN=false", () => {
  it("renders children", async () => {
    await renderProvider(false, { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("provides working storage context via Zustand", async () => {
    const { StorageProvider, useStorage } = await setupProvider(false);

    let captured: ReturnType<typeof useStorage> | undefined;
    function StorageReader() {
      captured = useStorage();
      return null;
    }

    render(
      <StorageProvider>
        <StorageReader />
      </StorageProvider>,
    );

    expect(captured).toBeDefined();
    expect(captured!.files).toEqual([]);
  });
});

describe("StorageProvider with FEATURE_SIGN_IN=true and loading auth", () => {
  it("renders nothing while auth is loading", async () => {
    await renderProvider(true, { isAuthenticated: false, isLoading: true });
    expect(screen.queryByTestId("child")).toBeNull();
  });
});

describe("StorageProvider with FEATURE_SIGN_IN=true and unauthenticated", () => {
  it("renders children via ZustandStorageProvider", async () => {
    await renderProvider(true, { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.queryByTestId("convex-storage")).toBeNull();
  });
});

describe("StorageProvider with FEATURE_SIGN_IN=true and authenticated", () => {
  it("renders children via ConvexStorageProvider", async () => {
    await renderProvider(true, { isAuthenticated: true, isLoading: false });

    await vi.waitFor(() => {
      expect(screen.getByTestId("convex-storage")).toBeDefined();
    });
    expect(screen.getByTestId("child")).toBeDefined();
  });
});
