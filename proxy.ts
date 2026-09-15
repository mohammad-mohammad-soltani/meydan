import { NextResponse, type NextRequest } from "next/server";
import { loginHref } from "@/lib/auth-navigation";
import { ACCESS_COOKIE } from "@/lib/meydan-session";
import { isProtectedPath, returnToFrom } from "@/lib/protected-routes";

/**
 * Route guard for the signed-in areas of the app.
 *
 * This is the middleware layer: it runs before any protected page renders, so
 * `/speakers` (اعزام سخنران) and every other protected route redirects to the
 * login page instead of rendering for a visitor without a session. Pages keep
 * their own `isAuthenticated()` checks as defence in depth — this catches the
 * request earlier and avoids shipping markup that would only be thrown away.
 *
 * The check is deliberately optimistic, per the Next.js guidance: the presence
 * of the access cookie is enough to let the request through, and the API stays
 * the authority on whether the token is still valid. No network call happens
 * here, so the guard stays fast and safe to run at the edge.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL(
    loginHref(returnToFrom(pathname, search)),
    request.nextUrl.origin,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Only the protected prefixes run the guard. Static assets, API routes and
   * image optimisation are excluded, so the middleware can never block CSS,
   * JS or media from loading.
   */
  matcher: [
    "/speakers/:path*",
    "/speaker-invitations/:path*",
    "/compose/:path*",
    "/chat/:path*",
    "/profile/:path*",
  ],
};
