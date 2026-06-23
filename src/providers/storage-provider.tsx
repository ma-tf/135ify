import type { ReactNode } from "react";

import { FEATURE_SIGN_IN } from "@config";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import React, { Suspense } from "react";

const LazyConvexStorage = FEATURE_SIGN_IN
  ? React.lazy(() => import("@providers/convex-storage"))
  : null;

export function StorageProvider({ children }: { children: ReactNode }) {
  if (FEATURE_SIGN_IN && LazyConvexStorage) {
    return (
      <Suspense fallback={null}>
        <LazyConvexStorage>{children}</LazyConvexStorage>
      </Suspense>
    );
  }
  return <ZustandStorageProvider>{children}</ZustandStorageProvider>;
}
