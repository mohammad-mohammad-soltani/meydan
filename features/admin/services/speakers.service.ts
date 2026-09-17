import type {
  AdminListResult,
  LinkableUser,
  SocialLink,
  SocialPlatform,
  Speaker,
  SpeakerCategory,
  SpeakerCreateInput,
  SpeakerProfileInput,
  SpeakerRequest,
  SpeakerRequestStatus,
  SpeakerStatusFilters,
} from "../types";
import {
  SOCIAL_PLATFORMS,
  SPEAKER_REQUEST_STATUSES,
} from "../types";
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

type ApiSpeaker = {
  id: number;
  user_id?: number | null;
  name?: string | null;
  bio?: string | null;
  role?: string | null;
  handle?: string | null;
  expertise?: string | null;
  initials?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  cities?: number[] | null;
  categories?: Array<{ slug?: string; name?: string }> | null;
  social_links?: Array<{ platform?: string; url?: string; label?: string }> | null;
};

type ApiInvitationActor = {
  id?: string | null;
  type?: string | null;
  display_name?: string | null;
};

type ApiSpeakerRequest = {
  id: number;
  status?: string | null;
  speaker?: ApiInvitationActor | null;
  inviter?: ApiInvitationActor | null;
  requester_user_id?: number | null;
  speaker_user_id?: number | null;
  message?: string | null;
  location?: string | null;
  requested_date?: string | null;
  requested_time?: string | null;
  requested_at?: string | null;
  created_at?: string | null;
  decided_at?: string | null;
  admin_note?: string | null;
  phone_visible?: boolean | null;
};

/* ---------------------------------------------------------------- mappers */

function mapSocialLinks(
  rows: ApiSpeaker["social_links"],
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

export function mapSpeaker(row: ApiSpeaker): Speaker {
  return {
    id: Number(row.id),
    userId: Number(row.user_id ?? row.id),
    name: String(row.name ?? ""),
    bio: String(row.bio ?? ""),
    role: String(row.role ?? ""),
    handle: String(row.handle ?? ""),
    expertise: String(row.expertise ?? ""),
    initials: String(row.initials ?? ""),
    avatarUrl: row.avatar_url || null,
    verified: Boolean(row.verified),
    cities: Array.isArray(row.cities) ? row.cities.map(Number).filter(Number.isFinite) : [],
    categories: (row.categories ?? [])
      .filter((category): category is { slug: string; name?: string } => Boolean(category?.slug))
      .map((category) => String(category.slug)),
    socialLinks: mapSocialLinks(row.social_links),
  };
}

function actorName(actor: ApiInvitationActor | null | undefined, fallback: string): string {
  return actor?.display_name ? String(actor.display_name) : fallback;
}

export function mapSpeakerRequest(row: ApiSpeakerRequest): SpeakerRequest {
  const status = SPEAKER_REQUEST_STATUSES.includes(row.status as SpeakerRequestStatus)
    ? (row.status as SpeakerRequestStatus)
    : "pending";

  return {
    id: Number(row.id),
    status,
    direction: String(row.location ?? ""),
    message: String(row.message ?? ""),
    adminNote: String(row.admin_note ?? ""),
    requesterUserId: row.requester_user_id ? Number(row.requester_user_id) : null,
    speakerUserId: row.speaker_user_id ? Number(row.speaker_user_id) : null,
    requesterName: actorName(row.inviter, "میدان"),
    speakerName: actorName(row.speaker, "سخنران"),
    requestedDate: String(row.requested_date ?? ""),
    requestedTime: String(row.requested_time ?? ""),
    createdAt: String(row.created_at ?? row.requested_at ?? ""),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
  };
}

/* ------------------------------------------------------------------- reads */

export const EMPTY_SPEAKER_FILTERS: SpeakerStatusFilters = {
  q: "",
  verified: "",
  speakerCategory: "",
  provinceId: null,
  cityId: null,
};

/**
 * The admin speaker list is capped at 50 rows by `SpeakerController::query` and
 * has no pagination, so the UI labels the cap instead of inventing pages.
 */
export const SPEAKER_LIST_CAP = 50;

export async function getAdminSpeakers(
  filters: SpeakerStatusFilters,
  init?: RequestInit,
): Promise<AdminListResult<Speaker>> {
  const rows = await adminGetItem<ApiSpeaker[]>(
    `/admin/speakers${query({
      q: filters.q.trim(),
      verified: filters.verified,
      speaker_category: filters.speakerCategory,
      city_id: filters.cityId,
    })}`,
    init,
  );
  return { items: (rows ?? []).map(mapSpeaker), paginated: false, cap: SPEAKER_LIST_CAP };
}

/**
 * Reads one speaker.
 *
 * There is no `GET /admin/speakers/{id}` route — the admin list is the only
 * admin read and `GET /speakers/{id}` is public but served from cache. The
 * lookup therefore goes through `/speakers/{id}` and falls back to the admin
 * list, so a just-promoted account (whose public document may still be cached
 * as "not a speaker") is still found.
 */
export async function getSpeaker(
  id: string,
  init?: RequestInit,
): Promise<Speaker | null> {
  try {
    const row = await adminGetItem<ApiSpeaker>(`/speakers/${segment(id)}`, init);
    if (row?.id) return mapSpeaker(row);
  } catch (reason) {
    if (!isNotFound(reason)) {
      // A network failure must not be masked as "not found"; the caller decides.
      throw reason;
    }
  }

  try {
    const { items } = await getAdminSpeakers(EMPTY_SPEAKER_FILTERS);
    return items.find((speaker) => String(speaker.userId) === String(id)) ?? null;
  } catch {
    return null;
  }
}

/** Only the accounts eligible for promotion — never admins, squares or speakers. */
export async function getLinkableUsers(init?: RequestInit): Promise<LinkableUser[]> {
  const rows = await adminGetItem<Array<{ id?: number; name?: string }>>(
    "/admin/speakers/linkable-users",
    init,
  );
  return (rows ?? [])
    .filter((row): row is { id: number; name?: string } => Number(row?.id) > 0)
    .map((row) => ({ id: Number(row.id), name: String(row.name ?? `کاربر ${row.id}`) }));
}

export async function getSpeakerCategories(init?: RequestInit): Promise<SpeakerCategory[]> {
  const rows = await adminGetItem<Array<{ slug?: string; name?: string }>>("/speaker-categories", init);
  return (rows ?? [])
    .filter((row): row is { slug: string; name?: string } => Boolean(row?.slug))
    .map((row) => ({ slug: String(row.slug), name: String(row.name ?? row.slug) }));
}

export const SPEAKER_REQUEST_LIST_CAP = 100;

export type SpeakerRequestFilters = {
  status: SpeakerRequestStatus | "";
};

export async function getSpeakerRequests(
  filters: SpeakerRequestFilters = { status: "" },
  init?: RequestInit,
): Promise<AdminListResult<SpeakerRequest>> {
  const rows = await adminGetItem<ApiSpeakerRequest[]>(
    `/admin/speaker-requests${query({ status: filters.status })}`,
    init,
  );
  return {
    items: (rows ?? []).map(mapSpeakerRequest),
    paginated: false,
    cap: SPEAKER_REQUEST_LIST_CAP,
  };
}

export async function getSpeakerRequest(
  id: string,
  init?: RequestInit,
): Promise<SpeakerRequest | null> {
  try {
    return mapSpeakerRequest(
      await adminGetItem<ApiSpeakerRequest>(`/admin/speaker-requests/${segment(id)}`, init),
    );
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

export async function getSpeakerInvitations(
  filters: SpeakerRequestFilters = { status: "" },
  init?: RequestInit,
): Promise<AdminListResult<SpeakerRequest>> {
  const rows = await adminGetItem<ApiSpeakerRequest[]>(
    `/admin/speaker-invitations${query({ status: filters.status })}`,
    init,
  );
  return {
    items: (rows ?? []).map(mapSpeakerRequest),
    paginated: false,
    cap: SPEAKER_REQUEST_LIST_CAP,
  };
}

export async function getSpeakerInvitation(
  id: string,
  init?: RequestInit,
): Promise<SpeakerRequest | null> {
  try {
    return mapSpeakerRequest(
      await adminGetItem<ApiSpeakerRequest>(`/admin/speaker-invitations/${segment(id)}`, init),
    );
  } catch (reason) {
    if (isNotFound(reason)) return null;
    throw reason;
  }
}

/* ------------------------------------------------------------------ writes */

function speakerProfileBody(input: SpeakerProfileInput): Record<string, unknown> {
  return {
    avatar_media_id: input.avatarMediaId ?? 0,
    verified: input.verified,
    cities: input.cities,
    categories: input.categories,
    social_links: input.socialLinks,
  };
}

/**
 * Promotion is idempotent on the backend, so re-submitting for an existing
 * speaker repairs the profile instead of failing.
 */
export async function promoteSpeaker(input: SpeakerCreateInput, init?: RequestInit): Promise<Speaker> {
  return mapSpeaker(
    await adminPost<ApiSpeaker>("/admin/speakers", {
      user_id: input.userId,
      ...speakerProfileBody(input),
    },
    init,
  ),
  );
}

export async function updateSpeaker(id: string, input: SpeakerProfileInput, init?: RequestInit): Promise<Speaker> {
  return mapSpeaker(
    await adminPatch<ApiSpeaker>(`/admin/speakers/${segment(id)}`, speakerProfileBody(input), init),
  );
}

/** Removes the speaker role; the WordPress account and its meta stay intact. */
export async function demoteSpeaker(id: string, init?: RequestInit): Promise<void> {
  await adminDelete<{ deleted?: boolean }>(`/admin/speakers/${segment(id)}`, init);
}

/** Moderation works on the shared speaker-request table for both surfaces. */
export async function setSpeakerRequestStatus(
  base: "speaker-requests" | "speaker-invitations",
  id: string,
  status: SpeakerRequestStatus,
  init?: RequestInit,
): Promise<SpeakerRequest> {
  return mapSpeakerRequest(
    await adminPatch<ApiSpeakerRequest>(`/admin/${base}/${segment(id)}`, { status }, init),
  );
}
