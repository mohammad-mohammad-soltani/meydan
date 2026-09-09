import { NextRequest, NextResponse } from "next/server";
import { getMeydanApiBaseUrl } from "@/lib/meydan-api";

const ACCESS_COOKIE = "meydan_access";
const REFRESH_COOKIE = "meydan_refresh";
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

type RouteContext = { params: Promise<{ path: string[] }> };
type JsonObject = Record<string, unknown>;

function backendUrl(path: string[], request: NextRequest): string {
  const suffix = path.map(encodeURIComponent).join("/");
  return `${getMeydanApiBaseUrl()}/${suffix}${request.nextUrl.search}`;
}

function refreshTokenFromSetCookie(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/(?:^|[,;]\s*)meydan_refresh=([^;,\s]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function setSessionCookies(
  response: NextResponse,
  accessToken?: string | null,
  accessMaxAge = ACCESS_MAX_AGE,
  refreshToken?: string | null,
) {
  if (accessToken) {
    response.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: accessMaxAge,
    });
  }
  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

async function readJson(response: Response): Promise<JsonObject | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as JsonObject;
  } catch {
    return null;
  }
}

async function callBackend(
  url: string,
  method: string,
  body: ArrayBuffer | undefined,
  contentType: string | null,
  accessToken?: string | null,
): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (contentType) headers.set("Content-Type", contentType);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, {
    method,
    headers,
    body: body && method !== "GET" && method !== "HEAD" ? body : undefined,
    cache: "no-store",
  });
}

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken: string | null;
} | null> {
  const response = await fetch(`${getMeydanApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const rotatedRefresh = refreshTokenFromSetCookie(response.headers.get("set-cookie"));
  const json = await readJson(response);
  const data = json?.data as JsonObject | undefined;
  const accessToken = typeof data?.access_token === "string" ? data.access_token : "";
  if (!accessToken) return null;

  return {
    accessToken,
    expiresIn: typeof data?.expires_in === "number" ? data.expires_in : ACCESS_MAX_AGE,
    refreshToken: rotatedRefresh,
  };
}

function sanitizeAuthPayload(json: JsonObject | null): JsonObject | null {
  if (!json || typeof json.data !== "object" || json.data === null) return json;
  const data = { ...(json.data as JsonObject) };
  delete data.access_token;
  delete data.refresh_token;
  return { ...json, data };
}

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const pathName = `/${path.join("/")}`;
  const isAuthEndpoint = pathName.startsWith("/auth/");
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const contentType = request.headers.get("content-type");

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value || null;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value || null;
  let backendResponse = await callBackend(backendUrl(path, request), method, body, contentType, accessToken);

  let refreshed: Awaited<ReturnType<typeof refreshAccessToken>> = null;
  if (backendResponse.status === 401 && !isAuthEndpoint && refreshToken) {
    refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      backendResponse = await callBackend(backendUrl(path, request), method, body, contentType, accessToken);
    }
  }

  const backendSetCookie = backendResponse.headers.get("set-cookie");
  const nextRefreshToken = refreshTokenFromSetCookie(backendSetCookie);
  const json = await readJson(backendResponse);
  const authData = json?.data as JsonObject | undefined;
  const issuedAccessToken = typeof authData?.access_token === "string" ? authData.access_token : null;
  const issuedExpiresIn = typeof authData?.expires_in === "number" ? authData.expires_in : ACCESS_MAX_AGE;

  const response = NextResponse.json(
    isAuthEndpoint ? sanitizeAuthPayload(json) : json ?? {},
    { status: backendResponse.status },
  );

  if (refreshed) setSessionCookies(response, refreshed.accessToken, refreshed.expiresIn, refreshed.refreshToken);
  if (issuedAccessToken) setSessionCookies(response, issuedAccessToken, issuedExpiresIn, nextRefreshToken);
  else if (nextRefreshToken) setSessionCookies(response, null, ACCESS_MAX_AGE, nextRefreshToken);

  if (pathName === "/auth/logout" || pathName === "/auth/logout-all") clearSessionCookies(response);
  if (backendResponse.status === 401 && refreshToken && !refreshed && !isAuthEndpoint) clearSessionCookies(response);

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
