export type PublicProfileActorType = "user" | "square";

/**
 * Public profile URLs are intentionally short and role-agnostic:
 * - squares: /square/{id}
 * - every user role (regular, speaker, official, admin, ...): /{id}
 */
export function publicProfileHref(
  type: PublicProfileActorType,
  id: string | number,
): string {
  const numericId = String(id).match(/(\d+)$/)?.[1] || "";
  if (!numericId) return "/";

  return type === "square" ? `/square/${numericId}` : `/${numericId}`;
}

/**
 * Converts links produced by older frontend/backend builds to the canonical
 * public profile URL while preserving query strings and hashes.
 */
export function canonicalPublicProfileHref(href: string): string {
  const value = href.trim();
  const match = value.match(
    /^\/(?:users|profile)\/(user|square)\/(\d+)([?#].*)?$/,
  );

  if (!match) return value;

  return `${publicProfileHref(match[1] as PublicProfileActorType, match[2])}${match[3] || ""}`;
}
