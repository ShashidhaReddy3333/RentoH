"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "rento-theme";
const LEGACY_STORAGE_KEY = "theme";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // ignore inability to read localStorage
  }

  return null;
}

const THEME_VARIABLES: Record<Theme, Record<string, string>> = {
  light: {
    "--color-brand-bg": "210 40% 98%",
    "--color-brand-light": "0 0% 100%",
    "--color-surface": "0 0% 100%",
    "--color-surface-muted": "214 32% 94%",
    "--color-brand-dark": "219 43% 14%",
    "--color-textc": "219 43% 14%",
    "--color-text-muted": "219 17% 46%",
    "--color-ink": "222 47% 12%",
    "--color-ink-muted": "218 18% 48%",
    "--color-brand-outline": "220 16% 80%",
    "--color-brand-primary": "217 90% 40%",
    "--color-brand-primary-strong": "221 83% 35%",
    "--color-brand-primary-muted": "217 100% 92%",
    "--color-brand-success": "152 61% 26%",
    "--color-brand-success-muted": "150 55% 88%",
    "--color-brand-warning": "36 88% 30%",
    "--color-brand-warning-muted": "45 96% 82%",
    "--color-danger": "0 78% 36%",
    "--color-danger-muted": "6 93% 90%",
    "--color-brand-teal": "174 75% 28%",
    "--color-brand-blue": "217 90% 45%",
    "--color-brand-green": "142 65% 28%",
    "--color-neutral-50": "214 45% 97%",
    "--color-neutral-100": "213 37% 92%",
    "--color-neutral-200": "216 28% 83%",
    "--color-neutral-300": "218 22% 70%",
    "--color-neutral-400": "220 17% 47%",
    "--color-neutral-500": "221 21% 39%",
    "--color-neutral-600": "224 32% 28%",
    "--color-neutral-700": "226 43% 20%",
    "--color-neutral-800": "228 49% 15%",
    "--color-neutral-900": "230 57% 10%"
  },
  dark: {
    "--color-brand-bg": "217 54% 10%",
    "--color-brand-light": "219 36% 18%",
    "--color-surface": "220 35% 18%",
    "--color-surface-muted": "220 30% 24%",
    "--color-brand-dark": "220 33% 92%",
    "--color-textc": "220 33% 92%",
    "--color-text-muted": "220 20% 70%",
    "--color-ink": "220 33% 92%",
    "--color-ink-muted": "220 20% 70%",
    "--color-brand-outline": "220 25% 32%",
    "--color-brand-primary": "217 92% 70%",
    "--color-brand-primary-strong": "220 100% 80%",
    "--color-brand-primary-muted": "220 60% 24%",
    "--color-brand-success": "152 65% 66%",
    "--color-brand-success-muted": "153 51% 23%",
    "--color-brand-warning": "36 92% 70%",
    "--color-brand-warning-muted": "32 70% 22%",
    "--color-danger": "0 80% 72%",
    "--color-danger-muted": "6 70% 24%",
    "--color-brand-teal": "174 70% 65%",
    "--color-brand-blue": "217 90% 65%",
    "--color-brand-green": "142 65% 62%",
    "--color-neutral-50": "220 45% 14%",
    "--color-neutral-100": "220 40% 18%",
    "--color-neutral-200": "220 35% 23%",
    "--color-neutral-300": "220 30% 30%",
    "--color-neutral-400": "220 28% 40%",
    "--color-neutral-500": "220 24% 60%",
    "--color-neutral-600": "220 26% 70%",
    "--color-neutral-700": "220 30% 78%",
    "--color-neutral-800": "220 36% 86%",
    "--color-neutral-900": "220 40% 92%"
  }
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = getStoredTheme();
  if (stored) {
    applyTheme(stored);
    if (stored !== window.localStorage.getItem(STORAGE_KEY)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, stored);
      } catch {
        // ignore write failure
      }
    }
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const nextTheme = prefersDark ? "dark" : "light";
  applyTheme(nextTheme);
  return nextTheme;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset["theme"] = theme;
  root.style.colorScheme = theme === "dark" ? "dark" : "light";

  const variables = THEME_VARIABLES[theme];
  Object.entries(variables).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // unable to persist theme (e.g., in private mode) – ignore
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme()) {
        return;
      }

      const nextTheme = event.matches ? "dark" : "light";
      setThemeState((current) => {
        if (current === nextTheme) {
          return current;
        }
        applyTheme(nextTheme);
        return nextTheme;
      });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState((current) => {
      if (current === next) {
        return current;
      }
      applyTheme(next);
      return next;
    });
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
