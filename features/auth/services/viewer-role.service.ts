import { meydanApi } from "@/lib/meydan-api";

/**
 * The single source of truth for "who is this viewer" is the API: `/me` returns
 * the WordPress `role`/`roles` pair. Both the admin layout gate (server-side)
 * and `useViewerRole` (client-side) read it through here so the two can never
 * disagree about what makes an administrator.
 */
export const ADMIN_ROLE = "administrator";

/** The WordPress role fields `GET /me` adds on top of the profile payload. */
export type ApiViewerRole = {
  role?: string | null;
  roles?: string[] | null;
};

export type ViewerRoles = {
  /** Primary WordPress role, e.g. `administrator`. */
  role: string;
  /** Every WordPress role granted to the viewer. */
  roles: string[];
};

export const NO_ROLES: ViewerRoles = { role: "", roles: [] };

/** Keeps only the non-empty string roles the backend may send. */
export function extractRoles(me: ApiViewerRole | null | undefined): string[] {
  if (!me || !Array.isArray(me.roles)) return [];

  return me.roles.filter(
    (role): role is string => typeof role === "string" && role.length > 0,
  );
}

export function viewerRoles(me: ApiViewerRole | null | undefined): ViewerRoles {
  const roles = extractRoles(me);
  const primary = typeof me?.role === "string" && me.role ? me.role : roles[0] || "";
  return { role: primary, roles };
}

/**
 * Fail-closed: anything other than an explicit `administrator` entry in the
 * role list is a non-administrator, including an empty or malformed payload.
 */
export function hasAdministratorRole(me: ApiViewerRole | null | undefined): boolean {
  return extractRoles(me).includes(ADMIN_ROLE);
}

/**
 * Reads the viewer's roles for server components. The caller passes the
 * request's auth headers (`accessTokenHeader()`), because a server render has
 * no ambient session for `meydanApi` to pick up.
 */
export async function fetchViewerRoles(
  headers?: Record<string, string>,
): Promise<ViewerRoles> {
  const me = await meydanApi<ApiViewerRole>("/me", headers ? { headers } : undefined);
  return viewerRoles(me);
}
