import type { ReactNode } from "react";

import { ZustandStorageProvider } from "@providers/zustand-storage";

export function StorageProvider({ children }: { children: ReactNode }) {
  return <ZustandStorageProvider>{children}</ZustandStorageProvider>;
}
