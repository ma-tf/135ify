import type { ReactNode } from "react";

import { processToBlobUrl } from "@features/process/process-image";
import { useFile } from "@providers/file-context";
import { isDefaultParams } from "@stores/file-store-types";
import { createContext, use, useCallback, useEffect, useRef, useState } from "react";

type EditViewContextValue = {
  imageSrc: string;
  setImageSrc: (url: string) => void;
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
  inspectUrl: string | null;
  setInspectUrl: (url: string | null) => void;
};

const EditViewContext = createContext<EditViewContextValue | null>(null);

function useEditViewState() {
  const file = useFile();
  const [imageSrc, setImageSrc] = useState(file.renderUrl ?? file.sourceUrl);
  const [showOriginal, setShowOriginal] = useState(false);
  const [inspectUrl, setInspectUrlState] = useState<string | null>(null);
  const mountFile = useRef(file);

  const setInspectUrl = useCallback((url: string | null) => {
    setInspectUrlState((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (inspectUrl) URL.revokeObjectURL(inspectUrl);
    };
  }, [inspectUrl]);

  useEffect(() => {
    const f = mountFile.current;
    if (f.renderUrl || isDefaultParams(f.params)) return;
    void processToBlobUrl(f.sourceUrl, f.params).then(setImageSrc);
  }, []);

  return { imageSrc, setImageSrc, showOriginal, setShowOriginal, inspectUrl, setInspectUrl };
}

export function EditViewProvider({ children }: { children: ReactNode }) {
  const editViewState = useEditViewState();

  return <EditViewContext.Provider value={editViewState}>{children}</EditViewContext.Provider>;
}

export function useEditView() {
  const ctx = use(EditViewContext);
  if (!ctx) throw new Error("useEditView must be used within EditViewProvider");
  return ctx;
}
