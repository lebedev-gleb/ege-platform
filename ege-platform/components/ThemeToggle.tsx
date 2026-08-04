"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Переключить тему"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-muted"
    >
      {mounted && (isDark ? <Sun size={16} /> : <Moon size={16} />)}
    </button>
  );
}