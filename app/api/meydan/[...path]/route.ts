import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/meydan-session";

const GUEST_COOKIE = "meydan_guest";
const DEFAULT_API_BASE = "https://meydan-api.nabzjahan.ir/wp-json/meydan/v1";

const apiBase = () =>
  (
    process.env.MEYDAN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");

function upstreamCookie(response: Response, name: string): string | undefined {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`))?.[1];
}

async function upstream(
  request: NextRequest,
  path: string[],
  accessToken?: string,
  body?: ArrayBuffer,
) {
  const url = new URL(`${apiBase()}/${path.join("/")}`);
  url.search = request.nextUrl.search;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const idempotencyKey = request.headers.get("idempotency-key");
  const guestId = request.cookies.get(GUEST_COOKIE)?.value;
  if (contentType) headers.set("content-type", contentType);
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);
  if (guestId) headers.set("cookie", `${GUEST_COOKIE}=${guestId}`);
  headers.set("accept", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  return fetch(url, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : body,
    cache: "no-store",
  });
}

async function refresh(refreshToken: string) {
  const response = await fetch(`${apiBase()}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as {
    data?: { access_token?: string };
  } | null;
  if (!response.ok || !body?.data?.access_token) return undefined;
  return {
    accessToken: body.data.access_token,
    refreshToken: upstreamCookie(response, REFRESH_COOKIE),
  };
}

async function handle(request: NextRequest, context: RouteContext<"/api/meydan/[...path]">) {
  const { path } = await context.params;
  // The request stream can be read only once. Preserve it so a refreshed
  // authenticated request can be retried without losing its payload.
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let response = await upstream(request, path, accessToken, body);
  let refreshed = false;
  let refreshedRefreshToken: string | undefined;

  if (response.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    const refreshedSession = refreshToken ? await refresh(refreshToken) : undefined;
    if (refreshedSession) {
      accessToken = refreshedSession.accessToken;
      refreshedRefreshToken = refreshedSession.refreshToken;
      refreshed = true;
      response = await upstream(request, path, accessToken, body);
    }
  }

  const guestId = upstreamCookie(response, GUEST_COOKIE);
  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers({
    "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
  });
  const requestId = response.headers.get("x-request-id");
  if (requestId) responseHeaders.set("x-request-id", requestId);
  const result = new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
  if (guestId) {
    result.cookies.set(GUEST_COOKIE, guestId, {
      ...sessionCookieOptions,
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  if (refreshed && accessToken) {
    result.cookies.set(ACCESS_COOKIE, accessToken, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE });
    if (refreshedRefreshToken) result.cookies.set(REFRESH_COOKIE, refreshedRefreshToken, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE });
  }
  if (response.status === 401) {
    result.cookies.delete(ACCESS_COOKIE);
    result.cookies.delete(REFRESH_COOKIE);
  }
  return result;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
