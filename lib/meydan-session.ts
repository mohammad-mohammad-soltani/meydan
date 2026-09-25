import { cookies } from "next/headers";

export const ACCESS_COOKIE = "meydan_access";
export const REFRESH_COOKIE = "meydan_refresh";
export const ACCESS_EXPIRY_COOKIE = "meydan_access_expires_at";
/**
 * The backend access token is short-lived, but this browser marker must outlive
 * it so a valid refresh token can renew the session on the next navigation.
 */
export const SESSION_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
/** Long-lived only for the installed Android WebView, never for browsers. */
export const NATIVE_SESSION_COOKIE_MAX_AGE = 20 * 365 * 24 * 60 * 60;

export function sessionCookieMaxAge(isNativeClient: boolean): number {
  return isNativeClient ? NATIVE_SESSION_COOKIE_MAX_AGE : SESSION_COOKIE_MAX_AGE;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function accessExpiry(expiresIn: number | undefined): string {
  const seconds = Number.isFinite(expiresIn) && Number(expiresIn) > 0
    ? Number(expiresIn)
    : 15 * 60;
  return String(Math.floor(Date.now() / 1000) + seconds);
}

export async function accessTokenHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean((await cookies()).get(ACCESS_COOKIE)?.value);
}
