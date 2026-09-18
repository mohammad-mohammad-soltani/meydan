import { NextResponse, type NextRequest } from "next/server";
import { loginHref } from "@/lib/auth-navigation";
import { getMeydanApiBaseUrl } from "@/lib/meydan-api";
import {
  ACCESS_COOKIE,
  ACCESS_EXPIRY_COOKIE,
  REFRESH_COOKIE,
  accessExpiry,
  SESSION_COOKIE_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/meydan-session";
import { isProtectedPath, returnToFrom } from "@/lib/protected-routes";

type RefreshedSession = { accessToken: string; expiresIn?: number };

async function refreshSession(refreshToken?: string): Promise<RefreshedSession | undefined> {
  if (!refreshToken) return undefined;

  try {
    const response = await fetch(`${getMeydanApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      data?: { access_token?: string; expires_in?: number };
    } | null;
    if (!response.ok || !body?.data?.access_token) return undefined;
    return { accessToken: body.data.access_token, expiresIn: body.data.expires_in };
  } catch {
    // A transient auth-origin outage must not turn an existing browser session
    // into a logout. The next navigation can retry the refresh.
    return undefined;
  }
}

function requestWithAccessToken(request: NextRequest, accessToken: string): Headers {
  const headers = new Headers(request.headers);
  const cookies = request.cookies
    .getAll()
    .filter((cookie) => cookie.name !== ACCESS_COOKIE)
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`);
  cookies.push(`${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}`);
  headers.set("cookie", cookies.join("; "));
  return headers;
}

/**
 * Route guard for the signed-in areas of the app.
 *
 * This is the middleware layer: it runs before any protected page renders, so
 * `/speakers` (اعزام سخنران) and every other protected route redirects to the
 * login page instead of rendering for a visitor without a session. Pages keep
 * their own `isAuthenticated()` checks as defence in depth — this catches the
 * request earlier and avoids shipping markup that would only be thrown away.
 *
 * The route remains optimistic for a current access token. When it has expired,
 * the proxy renews it with the browser's refresh credential before rendering a
 * protected page, so server-rendered reads receive a current bearer token.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = isProtectedPath(pathname);

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const accessExpiryAt = Number(request.cookies.get(ACCESS_EXPIRY_COOKIE)?.value || 0);
  const needsRefresh = !accessToken || !Number.isFinite(accessExpiryAt) || accessExpiryAt <= Date.now() / 1000 + 60;

  if (!needsRefresh) return NextResponse.next();

  const refreshed = await refreshSession(refreshToken);
  if (refreshed) {
    const requestHeaders = requestWithAccessToken(request, refreshed.accessToken);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.set(ACCESS_COOKIE, refreshed.accessToken, {
      ...sessionCookieOptions,
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    response.cookies.set(ACCESS_EXPIRY_COOKIE, accessExpiry(refreshed.expiresIn), {
      ...sessionCookieOptions,
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return response;
  }

  // An older access cookie may still be valid if the expiry marker was absent
  // (for example, immediately after deploying this change). Let the backend
  // decide rather than treating the cookie migration as a logout. Public
  // pages must also remain available to guests when no session exists.
  if (accessToken || !isProtected) return NextResponse.next();

  const loginUrl = new URL(
    loginHref(returnToFrom(pathname, search)),
    request.nextUrl.origin,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Run on document/app requests so a valid refresh credential can restore a
   * session before public pages render. API routes, static assets and files
   * with extensions are excluded because they have their own lifecycle.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.[^.]+$).*)",
  ],
};
