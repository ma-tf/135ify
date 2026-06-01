import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/use-theme";

const icons = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

const labels = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
} as const;

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const Icon = icons[theme];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={labels[theme]}
      className="cursor-pointer rounded-md p-2 text-stone-600 transition-colors hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-700"
    >
      <Icon size={18} aria-hidden />
    </button>
  );
}
