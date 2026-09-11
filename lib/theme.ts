export type ThemeName = "light" | "dark" | "black";

export const THEME_STORAGE_KEY = "meydan-theme";

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

  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}
