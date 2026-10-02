/**
 * Which pages require a signed-in visitor.
 *
 * The rule lives here rather than inline in the middleware so the route policy
 * can be unit-tested without booting Next: the middleware is the enforcement
 * point, this module is the decision.
 */

/**
 * Prefixes whose whole subtree is protected. A page is protected when its
 * pathname equals a prefix or continues past it at a `/` boundary, so
 * `/speaker-invitations` and its descendants are guarded while the public
 * `/speakers` directory remains available to guests.
 */
export const PROTECTED_ROUTE_PREFIXES = [
  "/speaker-invitations",
  "/compose",
  "/chat",
  "/works",
  "/profile",
  // The admin panel needs *a* session to be rendered at all; the role check
  // that rejects non-administrators lives in `app/(app)/admin/layout.tsx`,
  // because the proxy must stay offline and cannot call `/me`.
  "/admin",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** The path to come back to after signing in, e.g. `/speakers?tab=map`. */
export function returnToFrom(pathname: string, search: string): string {
  const query = search && !search.startsWith("?") ? `?${search}` : search;
  return `${pathname}${query ?? ""}`;
}
