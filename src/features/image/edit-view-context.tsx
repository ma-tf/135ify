import type { ReactNode } from "react";

import { useFile } from "@providers/file-context";
import { createContext, use, useCallback, useEffect, useState } from "react";

type EditViewContextValue = {
  imageSrc: string;
  setImageSrc: (url: string) => void;
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
  inspectUrl: string | null;
  setInspectUrl: (url: string | null) => void;
};

const EditViewContext = createContext<EditViewContextValue | null>(null);

export function EditViewProvider({ children }: { children: ReactNode }) {
  const file = useFile();
  const [imageSrc, setImageSrc] = useState(file.renderUrl ?? file.sourceUrl);
  const [showOriginal, setShowOriginal] = useState(false);
  const [inspectUrl, setInspectUrlState] = useState<string | null>(null);

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

  return (
    <EditViewContext.Provider
      value={{ imageSrc, setImageSrc, showOriginal, setShowOriginal, inspectUrl, setInspectUrl }}
    >
      {children}
    </EditViewContext.Provider>
  );
}

export function useEditView() {
  const ctx = use(EditViewContext);
  if (!ctx) throw new Error("useEditView must be used within EditViewProvider");
  return ctx;
}
