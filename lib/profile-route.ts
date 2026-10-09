/**
 * Top-level paths that are app routes or static files and therefore can never
 * be a profile handle: profiles live at `/{handle}`. Mirrors `Handles::RESERVED`
 * in the backend; `tests/public-profile-routes.test.mjs` checks that every
 * top-level route folder of the app is listed.
 *
 * This module has no imports on purpose: tests load it with plain Node.
 */
export const RESERVED_HANDLES: readonly string[] = [
  "admin", "administrator", "root", "support", "help", "meydan", "official", "system",
  "api", "www", "null", "undefined", "me", "user", "users", "square", "speaker", "works",
  "squares", "media", "collective", "collectives", "organization", "organizations", "memorial", "memorials", "entities", "profiles",
  "home", "explore", "chat", "compose", "content", "initiatives", "map", "podcasts", "posts", "post",
  "profile", "speakers", "auth", "direct", "login", "logout", "register", "signup", "settings",
  "notifications", "search", "images", "maps", "fonts", "static", "assets", "offline", "favicon",
  "icon", "manifest", "robots", "sitemap", "sw", "terms", "privacy", "about", "contact", "bookmarks", "videos", "drafts", "bistcall", "screening",
];

/** Every kind of public actor. Media, collectives and organizations are entities of their own. */
export const ACTOR_KINDS = ["user", "square", "media", "collective", "organization", "memorial"] as const;
export type ActorKind = (typeof ACTOR_KINDS)[number];
/** Kept for existing imports. */
export type PublicProfileActorType = ActorKind;

/** The kinds that own an entity profile (everything except a plain user). */
export const ENTITY_KINDS = ["square", "media", "collective", "organization", "memorial"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  square: "میدان",
  media: "رسانه",
  collective: "مجموعه",
  organization: "سازمان",
  memorial: "یادبود",
};

/** Memorials get their own profile design, so callers branch on this rather than comparing strings. */
export const isMemorialKind = (value: unknown): value is "memorial" => value === "memorial";

export function isActorKind(value: unknown): value is ActorKind {
  return typeof value === "string" && (ACTOR_KINDS as readonly string[]).includes(value);
}

export function isEntityKind(value: unknown): value is EntityKind {
  return typeof value === "string" && (ENTITY_KINDS as readonly string[]).includes(value);
}

/** Normalizes an API actor type; unknown values fall back instead of being guessed as `square`. */
export function actorKindOf(value: unknown, fallback: ActorKind = "user"): ActorKind {
  return isActorKind(value) ? value : fallback;
}

/** Backend path of an entity's public profile: squares keep `/squares`, other kinds use `/entities`. */
export function entityApiPath(kind: EntityKind, id: string | number): string {
  return kind === "square" ? `/squares/${id}` : `/entities/${kind}/${id}`;
}

const HANDLE = /^[A-Za-z0-9_]{3,30}$/;

/** Placeholder handles the app used to invent (`square_12`) are not real addresses. */
const PLACEHOLDER_HANDLE = /^(?:user|square|media|collective|organization|speaker)_\d+$/i;

export function cleanHandle(handle?: string | null): string {
  const value = (handle ?? "").trim().replace(/^@/, "");
  return HANDLE.test(value) && !PLACEHOLDER_HANDLE.test(value) ? value.toLowerCase() : "";
}

/** True for a path that is a single profile handle, e.g. `/reza_salehi`. */
export function isPublicProfilePath(pathname: string): boolean {
  const match = pathname.match(/^\/([A-Za-z0-9_]{3,30})\/?$/);
  return Boolean(match) && !RESERVED_HANDLES.includes(match![1].toLowerCase());
}

/**
 * The one way to link to a public profile: `/{handle}` for every kind.
 *
 * Without a handle (an old payload) it falls back to the id-based address,
 * which the app redirects to `/{handle}`.
 */
export function publicProfileHref(
  type: ActorKind,
  id: string | number,
  handle?: string | null,
): string {
  const clean = cleanHandle(handle);
  if (clean) return `/${clean}`;

  const numericId = String(id).match(/(\d+)$/)?.[1] || "";
  if (!numericId) return "/";
  return `/users/${type}/${numericId}`;
}

/**
 * Converts links produced by older frontend/backend builds (`/square/12`,
 * `/profile/user/3`) to the id-based address that redirects to `/{handle}`,
 * preserving query strings and hashes.
 */
export function canonicalPublicProfileHref(href: string): string {
  const value = href.trim();
  const legacy = value.match(/^\/(?:users|profile)\/(user|square|media|collective|organization|memorial)\/(\d+)([?#].*)?$/);
  if (legacy) return `/users/${legacy[1]}/${legacy[2]}${legacy[3] || ""}`;
  const square = value.match(/^\/square\/(\d+)([?#].*)?$/);
  if (square) return `/users/square/${square[1]}${square[2] || ""}`;
  return value;
}
