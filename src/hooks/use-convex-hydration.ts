import type { ConvexImageDoc } from "@providers/convex-hydration";

import { hydrateFromConvex } from "@providers/convex-hydration";
import { useFileStore } from "@stores/file-store";
import { useEffect, useRef } from "react";

export function useConvexHydration(convexImages: { status: string; data?: ConvexImageDoc[] }) {
  const storeHydrateFiles = useFileStore((s) => s.hydrateFiles);
  const storeFiles = useFileStore((s) => s.files);
  const storeFilesRef = useRef(storeFiles);

  useEffect(() => {
    storeFilesRef.current = storeFiles;
  });

  const queryData = convexImages.status === "success" ? convexImages.data : null;

  useEffect(() => {
    if (!queryData) return;
    const records = hydrateFromConvex(queryData, storeFilesRef.current);
    storeHydrateFiles(records);
  }, [queryData]);
}
