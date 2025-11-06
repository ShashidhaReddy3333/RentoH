"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

import { useTheme } from "@/app/theme-provider";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;
  const nextModeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-brand-outline/60 bg-surface px-3 py-2 text-sm font-medium text-text-muted shadow-sm transition hover:border-brand-teal/40 hover:bg-brand-teal/10 hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg",
        className
      )}
      aria-label={nextModeLabel}
      title={nextModeLabel}
    >
      <span className="relative h-5 w-5">
        <SunIcon
          className={clsx(
            "absolute inset-0 h-5 w-5 transition-opacity duration-200",
            isDark ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />
        <MoonIcon
          className={clsx(
            "absolute inset-0 h-5 w-5 transition-opacity duration-200",
            isDark ? "opacity-0" : "opacity-100"
          )}
          aria-hidden="true"
        />
      </span>
      {showLabel ? (
        <span>{isDark ? "Light" : "Dark"} mode</span>
      ) : (
        <span className="sr-only">{nextModeLabel}</span>
      )}
    </button>
  );
}
