import { FEATURE_SIGN_IN } from "@config";
import { useConvexAuth } from "@convex-dev/auth/react";

export function useAuth() {
  const auth = useConvexAuth();
  if (!FEATURE_SIGN_IN) {
    return { isAuthenticated: false, isLoading: false };
  }
  return auth ?? { isAuthenticated: false, isLoading: false };
}
