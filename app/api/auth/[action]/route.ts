import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from "@/lib/meydan-session";

const routes: Record<string, string> = {
  "otp-request": "/auth/otp/request",
  "otp-verify": "/auth/otp/verify",
  "register-user": "/auth/register/user",
  "register-square": "/auth/register/square",
  logout: "/auth/logout",
};

function baseUrl() {
  const value = process.env.MEYDAN_API_BASE_URL || process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL;
  if (!value) throw new Error("MEYDAN_API_BASE_URL is not configured.");
  return value.replace(/\/$/, "");
}

function refreshFromSetCookie(value: string | null): string | undefined {
  return value?.match(/(?:^|,\s*)meydan_refresh=([^;]+)/)?.[1];
}

export async function POST(request: NextRequest, context: RouteContext<"/api/auth/[action]">) {
  const { action } = await context.params;
  const route = routes[action];
  if (!route) return NextResponse.json({ error: { code: "not_found", message: "مسیر ورود پیدا نشد." } }, { status: 404 });

  const headers: HeadersInit = { accept: "application/json" };
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) headers.Authorization = `Bearer ${access}`;
  if (action !== "logout") headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl()}${route}`, {
    method: "POST",
    headers,
    body: action === "logout" ? undefined : await request.text(),
    cache: "no-store",
  });
  const raw = await response.text();
  const result = new NextResponse(raw, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json; charset=utf-8" },
  });
  const body = (() => {
    try {
      return JSON.parse(raw || "{}") as { data?: { access_token?: string } };
    } catch {
      return {};
    }
  })();
  const refresh = refreshFromSetCookie(response.headers.get("set-cookie"));
  if (body.data?.access_token) result.cookies.set(ACCESS_COOKIE, body.data.access_token, { ...sessionCookieOptions, maxAge: 15 * 60 });
  if (refresh) result.cookies.set(REFRESH_COOKIE, refresh, { ...sessionCookieOptions, maxAge: 30 * 24 * 60 * 60 });
  if (action === "logout" && response.ok) {
    result.cookies.delete(ACCESS_COOKIE);
    result.cookies.delete(REFRESH_COOKIE);
  }
  return result;
}
