import type { ReactNode } from "react";

import { FEATURE_SIGN_IN } from "@config";
import { useAuth } from "@hooks/use-auth";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import React, { Suspense } from "react";

const LazyConvexStorage = FEATURE_SIGN_IN
  ? React.lazy(() => import("@providers/convex-storage"))
  : null;

function StorageProviderAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <ZustandStorageProvider>{children}</ZustandStorageProvider>;

  return (
    <Suspense fallback={null}>
      {LazyConvexStorage && <LazyConvexStorage>{children}</LazyConvexStorage>}
    </Suspense>
  );
}

export function StorageProvider({ children }: { children: ReactNode }) {
  if (FEATURE_SIGN_IN && LazyConvexStorage) {
    return <StorageProviderAuthGate>{children}</StorageProviderAuthGate>;
  }
  return <ZustandStorageProvider>{children}</ZustandStorageProvider>;
}
