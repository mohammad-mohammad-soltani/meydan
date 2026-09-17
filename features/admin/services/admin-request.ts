import { accessTokenHeader } from "@/lib/meydan-session";

/**
 * Adds the session token to an admin API request.
 *
 * Why this is needed at all: the browser's admin requests go through
 * `app/api/meydan/[...path]`, which reads the httpOnly `meydan_access` cookie
 * and sets the `Authorization` header itself. A server-rendered admin page calls
 * the API origin directly and has no such proxy, so without this header every
 * `/admin/*` read answers 401 and the section renders its error state even for a
 * signed-in administrator.
 *
 * It is a separate module from `./admin-api` on purpose. `admin-api` is imported
 * by a client component (`MediaPickerField`), and importing `next/headers`
 * anywhere in that chain fails the build with "You're importing a module that
 * depends on next/headers". Only services import this file, and services are
 * server-only.
 *
 * The token is read per call rather than captured once so a long-lived page
 * render cannot keep using a session that was refreshed in the meantime, and
 * `accessTokenHeader` returns an empty object when there is no cookie — an
 * anonymous request stays anonymous instead of sending `Bearer undefined`.
 */
export async function withAdminAuth(init?: RequestInit): Promise<RequestInit> {
  const auth = await accessTokenHeader();
  return {
    ...init,
    headers: {
      ...((init?.headers as Record<string, string> | undefined) || {}),
      ...auth,
    },
  };
}
