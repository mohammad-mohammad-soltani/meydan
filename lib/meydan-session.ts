import { cookies } from "next/headers";

export const ACCESS_COOKIE = "meydan_access";
export const REFRESH_COOKIE = "meydan_refresh";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function accessTokenHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean((await cookies()).get(ACCESS_COOKIE)?.value);
}
