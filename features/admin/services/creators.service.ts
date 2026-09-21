import type {
  Creator,
  CreatorInput,
  MediaOutlet,
  MediaOutletInput,
  SocialLink,
  SocialPlatform,
} from "../types";
import { SOCIAL_PLATFORMS } from "../types";
import {
  adminDelete,
  adminErrorMessage,
  adminGetItem,
  adminPatch,
  adminPost,
  isNotFound,
  query,
  segment,
} from "./admin-api";

export { adminErrorMessage, isNotFound };

/* ------------------------------------------------------------------- wire */

type ApiCreator = {
  id: number;
  name?: string | null;
  types?: string[] | null;
  role?: string | null;
  bio?: string | null;
  handle?: string | null;
  expertise?: string | null;
  initials?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  cities?: number[] | null;
  social_links?: Array<{ platform?: string; url?: string; label?: string }> | null;
};

type ApiOutlet = {
  id: number;
  name?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  bale?: string | null;
  eitaa?: string | null;
};

function mapSocialLinks(
  rows: ApiCreator["social_links"],
): SocialLink[] {
  return (rows ?? [])
    .filter((row): row is { platform?: string; url?: string; label?: string } => Boolean(row?.url))
    .map((row) => {
      const platform = SOCIAL_PLATFORMS.includes(row.platform as SocialPlatform)
        ? (row.platform as SocialPlatform)
        : "other";
      const label = String(row.label ?? "").trim();
      return label
        ? { platform, url: String(row.url), label }
        : { platform, url: String(row.url) };
    });
}

export function mapCreator(row: ApiCreator): Creator {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    types: (row.types ?? []).map(String),
    role: String(row.role ?? ""),
    bio: String(row.bio ?? ""),
    handle: String(row.handle ?? ""),
    expertise: String(row.expertise ?? ""),
    initials: String(row.initials ?? ""),
    avatarUrl: row.avatar_url || null,
    verified: Boolean(row.verified),
    cities: Array.isArray(row.cities) ? row.cities.map(Number).filter(Number.isFinite) : [],
    socialLinks: mapSocialLinks(row.social_links),
  };
}

export function mapOutlet(row: ApiOutlet): MediaOutlet {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    avatarUrl: row.avatar_url || null,
    website: String(row.website ?? ""),
    bale: String(row.bale ?? ""),
    eitaa: String(row.eitaa ?? ""),
  };
}

/* ------------------------------------------------------------------- reads */

/**
 * `GET /creators` only returns `publish` rows and caps at 50, so — like the
 * content list — it cannot show a draft. Said out loud in the header.
 */
export const CREATOR_LIST_LIMITATION =
  "فهرست تولیدکنندگان فقط موارد منتشرشده را نشان می‌دهد و حداکثر ۵۰ ردیف دارد.";

export const CREATOR_LIST_CAP = 50;
export const OUTLET_LIST_CAP = 100;

export type CreatorFilters = {
  q: string;
  verified: boolean;
  category: string;
};

export const EMPTY_CREATOR_FILTERS: CreatorFilters = { q: "", verified: false, category: "" };

export async function getCreators(
  filters: CreatorFilters = EMPTY_CREATOR_FILTERS,
  init?: RequestInit,
): Promise<Creator[]> {
  const rows = await adminGetItem<ApiCreator[]>(
    `/admin/creators${query({
      q: filters.q.trim(),
      verified: filters.verified ? "true" : "",
      category: filters.category,
    })}`,
    init,
  );
  return (rows ?? []).map(mapCreator);
}

export async function getCreator(
  id: string,
  init?: RequestInit,
): Promise<Creator | null> {
  try {
    return mapCreator(await adminGetItem<ApiCreator>(`/admin/creators/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

export async function getMediaOutlets(
  q = "",
  init?: RequestInit,
): Promise<MediaOutlet[]> {
  const rows = await adminGetItem<ApiOutlet[]>(`/media-outlets${query({ q: q.trim() })}`, init);
  return (rows ?? []).map(mapOutlet);
}

export async function getMediaOutlet(id: string, init?: RequestInit): Promise<MediaOutlet | null> {
  try {
    return mapOutlet(await adminGetItem<ApiOutlet>(`/media-outlets/${segment(id)}`, init));
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

/** The outlet picker uses the same public list, so ids always resolve. */
export const OUTLET_LIST_LIMITATION =
  "فهرست رسانه‌ها فقط موارد منتشرشده را نشان می‌دهد؛ برای دیدن بقیه از پیشخوان وردپرس استفاده کنید.";

/* ------------------------------------------------------------------ writes */

export function creatorBody(input: CreatorInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    bio: input.bio,
    types: input.types,
    role: input.role.trim(),
    handle: input.handle.trim(),
    expertise: input.expertise.trim(),
    initials: input.initials.trim(),
    ...(input.avatarMediaId !== null ? { avatar_media_id: input.avatarMediaId } : {}),
    verified: input.verified,
    cities: input.cities,
    social_links: input.socialLinks,
  };
}

export async function createCreator(input: CreatorInput, init?: RequestInit): Promise<Creator> {
  return mapCreator(await adminPost<ApiCreator>("/admin/creators", creatorBody(input), init));
}

export async function updateCreator(id: string, input: CreatorInput, init?: RequestInit): Promise<Creator> {
  return mapCreator(
    await adminPatch<ApiCreator>(`/admin/creators/${segment(id)}`, creatorBody(input), init),
  );
}

export async function deleteCreator(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/creators/${segment(id)}`, init);
}

export function outletBody(input: MediaOutletInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    ...(input.avatarMediaId !== null ? { avatar_media_id: input.avatarMediaId } : {}),
    website: input.website.trim(),
    bale: input.bale.trim(),
    eitaa: input.eitaa.trim(),
  };
}

export async function createMediaOutlet(input: MediaOutletInput, init?: RequestInit): Promise<MediaOutlet> {
  return mapOutlet(await adminPost<ApiOutlet>("/admin/media-outlets", outletBody(input), init));
}

export async function updateMediaOutlet(
  id: string,
  input: MediaOutletInput,
  init?: RequestInit,
): Promise<MediaOutlet> {
  return mapOutlet(
    await adminPatch<ApiOutlet>(`/admin/media-outlets/${segment(id)}`, outletBody(input), init),
  );
}

export async function deleteMediaOutlet(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/media-outlets/${segment(id)}`, init);
}
