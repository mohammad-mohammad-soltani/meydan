import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_EXPIRY_COOKIE,
  REFRESH_COOKIE,
  accessExpiry,
  sessionCookieOptions,
  sessionCookieMaxAge,
} from "@/lib/meydan-session";
import { getMeydanApiBaseUrl } from "@/lib/meydan-api";
import { isNaghshmanNativeClient } from "@/lib/native-client";
import {
  parseAuthUpstreamPayload,
  type AuthUpstreamPayload,
} from "@/lib/auth-upstream";

const routes: Record<string, string> = {
  "otp-request": "/auth/otp/request",
  "otp-verify": "/auth/otp/verify",
  "register-user": "/auth/register/user",
  "register-square": "/auth/register/square",
  "register-entity": "/auth/register/entity",
  "native-restore": "/auth/refresh",
  logout: "/auth/logout",
};

function refreshFromSetCookie(value: string | null): string | undefined {
  return value?.match(/(?:^|,\s*)meydan_refresh=([^;]+)/)?.[1];
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest, context: RouteContext<"/api/auth/[action]">) {
  const { action } = await context.params;
  const route = routes[action];
  if (!route) {
    return jsonError("not_found", "مسیر ورود پیدا نشد.", 404);
  }

  const headers: HeadersInit = { accept: "application/json" };
  const isNativeClient = isNaghshmanNativeClient(request.headers.get("user-agent"));
  if (action === "native-restore" && !isNativeClient) {
    return jsonError("native_client_required", "این مسیر فقط برای اپلیکیشن نقش من است.", 403);
  }
  if (isNativeClient) headers["x-meydan-client"] = "naghshman-native";
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) headers.Authorization = `Bearer ${access}`;
  if (action !== "logout") headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${getMeydanApiBaseUrl()}${route}`, {
      method: "POST",
      headers,
      body: action === "logout" ? undefined : await request.text(),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[auth-proxy] upstream request failed", error);
    return jsonError(
      "auth_upstream_unavailable",
      "ارتباط با سرور ورود برقرار نشد. دوباره تلاش کنید.",
      502,
    );
  }

  const raw = await response.text();
  const parsed: AuthUpstreamPayload | null = parseAuthUpstreamPayload(raw);

  if (!parsed) {
    console.error("[auth-proxy] upstream returned non-JSON response", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      preview: raw.slice(0, 180),
    });
    return jsonError(
      "auth_upstream_invalid_response",
      response.ok
        ? "سرور ورود پاسخ نامعتبر برگرداند."
        : "سرور ورود با خطای داخلی روبه‌رو شد. دوباره تلاش کنید.",
      response.ok ? 502 : response.status,
    );
  }

  const result = NextResponse.json(parsed, { status: response.status });
  const refresh = refreshFromSetCookie(response.headers.get("set-cookie"));

  if (parsed.data?.access_token) {
    result.cookies.set(ACCESS_COOKIE, parsed.data.access_token, {
      ...sessionCookieOptions,
      maxAge: sessionCookieMaxAge(isNativeClient),
    });
    result.cookies.set(ACCESS_EXPIRY_COOKIE, accessExpiry(parsed.data.expires_in), {
      ...sessionCookieOptions,
      maxAge: sessionCookieMaxAge(isNativeClient),
    });
  }
  if (refresh) {
    result.cookies.set(REFRESH_COOKIE, refresh, {
      ...sessionCookieOptions,
      maxAge: sessionCookieMaxAge(isNativeClient),
    });
  }
  if (action === "logout" && response.ok) {
    result.cookies.delete(ACCESS_COOKIE);
    result.cookies.delete(ACCESS_EXPIRY_COOKIE);
    result.cookies.delete(REFRESH_COOKIE);
  }

  return result;
}
