import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme): void {
  const isDark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", isDark);
}

function subscribeToSystem(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Theme {
  return getStoredTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

export function useTheme() {
  const stored = useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);

  const systemDark = useSyncExternalStore(subscribeToSystem, getSystemDark, () => false);

  const resolved: "light" | "dark" =
    stored === "dark" || (stored === "system" && systemDark) ? "dark" : "light";

  useEffect(() => {
    applyTheme(stored);
  }, [stored]);

  const setTheme = useCallback((theme: Theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  const cycle = useCallback(() => {
    const order: Theme[] = ["system", "light", "dark"];
    const idx = order.indexOf(stored);
    setTheme(order[(idx + 1) % order.length]);
  }, [stored, setTheme]);

  return { theme: stored, resolved, setTheme, cycle } as const;
}
