"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { UI_THEME_STORAGE_KEY } from "@/lib/constants/storage-keys";

type ThemeSetting = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemeSetting;
  setTheme: (theme: string) => void;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeSetting {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function systemPreference(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(setting: ThemeSetting): "light" | "dark" {
  return setting === "system" ? systemPreference() : setting;
}

function applyDomTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

type AppThemeProviderProps = {
  children: ReactNode;
};

/**
 * Theme without an inline script tag (avoids React 19 / Next dev warnings from next-themes).
 * Until the client mounts, `resolvedTheme` stays `"light"` so SSR and the first client pass match.
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  const resolvedTheme = useMemo(
    () => (mounted ? resolveTheme(theme) : "light"),
    [mounted, theme, systemTheme],
  );

  useLayoutEffect(() => {
    setThemeState(readStoredTheme());
    setSystemTheme(systemPreference());
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    applyDomTheme(resolvedTheme);
  }, [mounted, resolvedTheme]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== UI_THEME_STORAGE_KEY) return;
      const v = e.newValue;
      if (v === "light" || v === "dark" || v === "system") setThemeState(v);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  const setTheme = useCallback((next: string) => {
    if (next !== "light" && next !== "dark" && next !== "system") return;
    setThemeState(next);
    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue & { themes: string[] } {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within AppThemeProvider");
  }
  return { ...ctx, themes: ["light", "dark", "system"] };
}
