"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemeName = "rpg" | "minimal";

const STORAGE_KEY = "pomodoro:theme";
const DEFAULT_THEME: ThemeName = "minimal";

function readStoredTheme(): ThemeName | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "rpg" || raw === "minimal" ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: ThemeName): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 保存できなくても表示上のテーマ切替自体は継続する
  }
}

/** テーマもモジュールスコープの外部ストアとして持つ (localStorageとの同期にuseSyncExternalStoreを使うため)。 */
let themeState: ThemeName = DEFAULT_THEME;
const listeners = new Set<() => void>();
let hasHydratedFromStorage = false;

function getSnapshot(): ThemeName {
  return themeState;
}

function getServerSnapshot(): ThemeName {
  return DEFAULT_THEME;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setThemeState(next: ThemeName): void {
  if (next === themeState) return;
  themeState = next;
  writeStoredTheme(next);
  for (const listener of listeners) listener();
}

function ensureHydrated(): void {
  if (hasHydratedFromStorage) return;
  hasHydratedFromStorage = true;
  const stored = readStoredTheme();
  if (stored) setThemeState(stored);
}

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureHydrated();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState(theme === "rpg" ? "minimal" : "rpg"),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
