import type { ReactNode } from "react";

import { FEATURE_SIGN_IN } from "@config";

let ConvexAuthProvider: React.ComponentType<any>;
let convexClient: any;

if (FEATURE_SIGN_IN) {
  const { ConvexAuthProvider: CAP } = await import("@convex-dev/auth/react");
  const { ConvexReactClient } = await import("convex/react");
  ConvexAuthProvider = CAP;
  convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  if (!FEATURE_SIGN_IN) return <>{children}</>;
  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
