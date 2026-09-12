export type ThemeName = "light" | "dark" | "black";

export const THEME_STORAGE_KEY = "meydan-theme";

/** Fired on `window` whenever any control applies a theme, so every mounted
 *  switcher stays in sync (desktop sidebar and mobile header coexist). */
export const THEME_CHANGE_EVENT = "meydan-theme-change";

export function normalizeTheme(value: string | null | undefined): ThemeName {
  if (value === "light" || value === "dark" || value === "black") return value;
  return "dark";
}

export function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function applyTheme(theme: ThemeName, persist = true): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("black", theme === "black");
  root.style.colorScheme = theme === "light" ? "light" : "dark";

  if (typeof window !== "undefined") {
    if (persist) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent<ThemeName>(THEME_CHANGE_EVENT, { detail: theme }));
  }
}

/** Subscribes to theme changes; returns the unsubscribe function. */
export function onThemeChange(listener: (theme: ThemeName) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) =>
    listener(normalizeTheme((event as CustomEvent<ThemeName>).detail));
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}
