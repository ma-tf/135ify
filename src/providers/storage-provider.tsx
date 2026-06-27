import type { ReactNode } from "react";

import { FEATURE_SIGN_IN } from "@config";
import { useAuth } from "@hooks/use-auth";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import { useFileStore } from "@stores/file-store";
import React, { Suspense, useEffect, useRef } from "react";

const LazyConvexStorage = FEATURE_SIGN_IN
  ? React.lazy(() => import("@providers/convex-storage"))
  : null;

function StorageProviderAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const clearFiles = useFileStore((s) => s.clearFiles);
  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (prevAuthenticated.current !== isAuthenticated) {
      const currentFiles = useFileStore.getState().files;
      currentFiles.forEach((f) => {
        URL.revokeObjectURL(f.sourceUrl);
        if (f.renderUrl) URL.revokeObjectURL(f.renderUrl);
      });
      clearFiles();
      prevAuthenticated.current = isAuthenticated;
    }
  }, [isAuthenticated, clearFiles]);

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
