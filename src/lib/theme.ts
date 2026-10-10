"use client";

import type { ThemeMode } from "@/lib/store";

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return systemPrefersDark() ? "dark" : "light";
}

/** Apply the resolved theme to <html> (class + native color-scheme). */
export function applyThemeToDocument(mode: ThemeMode) {
  const dark = resolveTheme(mode) === "dark";
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Toggle between light & dark. When the current mode is "system", the
 * explicit mode set is the opposite of what the system renders right now.
 */
export function toggleTheme(current: ThemeMode): "light" | "dark" {
  return resolveTheme(current) === "dark" ? "light" : "dark";
}
