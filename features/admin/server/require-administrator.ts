import { redirect } from "next/navigation";
import { fetchViewerRoles, hasAdministratorRole } from "@/features/auth/services/viewer-role.service";
import { loginHref } from "@/lib/auth-navigation";
import { MeydanApiError } from "@/lib/meydan-api";
import { accessTokenHeader, isAuthenticated } from "@/lib/meydan-session";

/**
 * The verdict a gate reached, as data rather than as an exception.
 *
 * The layout must be able to *render* a denial, and React does not allow JSX to
 * be built inside the `try` that produced it (an error thrown while rendering is
 * not caught by that `try`). Returning a discriminated result keeps the decision
 * and the rendering in separate places.
 */
export type GateOutcome =
  | { status: "administrator" }
  | { status: "denied"; role: string }
  | { status: "unavailable" };

/**
 * Resolves whether the current viewer may use the admin panel.
 *
 * It exists twice on purpose. A nested page segment is still evaluated when its
 * parent layout renders something other than `{children}`, so a layout-only gate
 * would let a non-administrator's request run the page — and its data queries —
 * and ship the resulting tree to the client. Each page therefore re-asks this
 * question before it touches the API.
 *
 * - no usable session → the login page. The redirect is driven by the cookie,
 *   not by a 401 response, which is what keeps it from looping;
 * - a confirmed non-administrator → `denied`, plus the role for the 403 screen;
 * - anything else (network, 5xx, malformed body) → `unavailable`, which the
 *   layout turns into a retryable screen. Collapsing that into `denied` would
 *   make an outage look like a permission problem.
 */
export async function resolveAdminGate(): Promise<GateOutcome> {
  if (!(await isAuthenticated())) redirect(loginHref("/admin"));

  const headers = await accessTokenHeader();
  try {
    const viewer = await fetchViewerRoles(headers);
    if (hasAdministratorRole({ role: viewer.role, roles: viewer.roles })) {
      return { status: "administrator" };
    }
    return { status: "denied", role: viewer.role };
  } catch (reason) {
    if (reason instanceof MeydanApiError && reason.status === 401) {
      redirect(loginHref("/admin"));
    }
    return { status: "unavailable" };
  }
}

/**
 * The same question as a boolean, for a page that only needs to decide whether
 * to render. The layout has already rendered the denial screen for every
 * non-administrator, so a page that is not an administrator renders `null`.
 */
export async function isAdministrator(): Promise<boolean> {
  return (await resolveAdminGate()).status === "administrator";
}
