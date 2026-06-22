import { FEATURE_SIGN_IN } from "@config";
import { ConvexStorageProvider } from "@providers/convex-storage";
import { ZustandStorageProvider } from "@providers/zustand-storage";
import { useConvexAuth } from "convex/react";

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (FEATURE_SIGN_IN && !isLoading && isAuthenticated) {
    return <ConvexStorageProvider>{children}</ConvexStorageProvider>;
  }

  return <ZustandStorageProvider>{children}</ZustandStorageProvider>;
}
