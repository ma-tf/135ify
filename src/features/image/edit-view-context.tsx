import type { ReactNode } from "react";

import { createContext, use, useCallback, useEffect, useState } from "react";

type EditViewContextValue = {
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
  inspectUrl: string | null;
  setInspectUrl: (url: string | null) => void;
};

const EditViewContext = createContext<EditViewContextValue | null>(null);

function useEditViewState() {
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

  return { showOriginal, setShowOriginal, inspectUrl, setInspectUrl };
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
