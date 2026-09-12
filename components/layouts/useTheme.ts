"use client";

import { useSyncExternalStore } from "react";
import { onThemeChange, readStoredTheme, type ThemeName } from "@/lib/theme";

function subscribe(onStoreChange: () => void) {
  return onThemeChange(() => onStoreChange());
}

/**
 * Current theme, read from `localStorage`. Uses `useSyncExternalStore` so the
 * server snapshot ("dark") hydrates cleanly and every mounted control stays in
 * sync when any other one applies a theme.
 */
export function useTheme(): ThemeName {
  return useSyncExternalStore(subscribe, readStoredTheme, () => "dark");
}
