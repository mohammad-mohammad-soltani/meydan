import type { Route } from "next";

export const DEFAULT_RETURN_TO = "/profile";
export const RETURN_TO_STORAGE_KEY = "meydan-return-to";

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_TO,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const base = new URL("https://meydan.local");
    const target = new URL(value, base);
    if (target.origin !== base.origin) return fallback;
    const pathname = decodeURIComponent(target.pathname);
    if (pathname === "/auth" || pathname.startsWith("/auth/")) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

export function loginHref(returnTo = DEFAULT_RETURN_TO): Route {
  return `/auth?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}` as Route;
}

export function rememberReturnTo(returnTo: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    RETURN_TO_STORAGE_KEY,
    sanitizeReturnTo(returnTo),
  );
}
