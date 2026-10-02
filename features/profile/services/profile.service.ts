import { MeydanApiError, isAuthApiError, meydanApi, meydanApiPage } from "@/lib/meydan-api";
import { entityApiPath, isEntityKind, type ActorKind, type EntityKind } from "@/lib/profile-route";
import { accessTokenHeader } from "@/lib/meydan-session";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileDetails, ProfileSocial } from "../types";
import type {
  ApiComment,
  ApiEntityMe,
  ApiMe,
  ApiMediaReflectionCount,
  ApiNarrative,
  ApiPublicUser,
  ApiSocial,
  WithSocial,
  ApiSquare,
} from "./profile-api-types";
import { mapNarrativePost } from "./profile-narrative-mappers";
import { mapSquare } from "./profile-square-mapper";
import { mapUser } from "./profile-user-mapper";

export async function getProfileNarrativePage(
  type: ActorKind,
  id: number,
  identity: ProfileDetails["identity"],
  cursor?: string | null,
  own = false,
): Promise<{
  posts: FeedPost[];
  nextCursor: string | null;
  count: number | null;
  pinned?: FeedPost | null;
}> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const path = own
    ? "/me/narratives"
    : `${isEntityKind(type) ? entityApiPath(type, id) : `/users/${id}`}/narratives`;
  const page = own
    ? await meydanApiPage<ApiNarrative[]>(`${path}?${params}`, {
        headers: await accessTokenHeader(),
      })
    : await getPublicNarrativePage(`${path}?${params}`);
  return {
    posts: page.data.map((item) => mapNarrativePost(item, identity)),
    nextCursor: page.nextCursor,
    count: page.count,
    // First page only: the backend adds the account's pinned narrative to `meta`.
    pinned: !cursor && page.meta && "pinned" in page.meta ? (page.meta.pinned ? mapNarrativePost(page.meta.pinned as ApiNarrative, identity) : null) : undefined,
  };
}

async function getPublicNarrativePage(path: string) {
  const headers = await accessTokenHeader();
  if (!headers.Authorization) return meydanApiPage<ApiNarrative[]>(path);
  try {
    return await meydanApiPage<ApiNarrative[]>(path, { headers });
  } catch (reason) {
    if (isAuthApiError(reason)) return meydanApiPage<ApiNarrative[]>(path);
    throw reason;
  }
}

type ApiProfilePage = {
  me: ApiMe;
  narratives: ApiNarrative[];
  replies: ApiComment[];
  square_meta: { start_date?: string | null; media_reflections?: number } | null;
  pinned?: ApiNarrative | null;
};

/** `social` from any profile payload, in app shape. */
export function socialFrom(value: ApiSocial | undefined | null): ProfileSocial | undefined {
  if (!value) return undefined;
  return { followers: Number(value.followers ?? 0), following: Number(value.following ?? 0), joinedAt: value.joined_at ?? undefined };
}

function withExtras(profile: ProfileDetails, social: ApiSocial | undefined | null, pinned: unknown): ProfileDetails {
  const pinnedPost = pinned && typeof pinned === "object" ? mapNarrativePost(pinned as ApiNarrative, profile.identity) : null;
  return { ...profile, social: socialFrom(social), pinnedPost };
}

/**
 * The whole own-profile page in one backend request (`/me/profile-page`).
 * Returns `undefined` when the endpoint is unavailable (an older backend), so
 * the caller falls back to the separate requests.
 */
async function profileFromSinglePage(
  headers: Record<string, string>,
): Promise<ProfileDetails | null | undefined> {
  let page: { data: ApiProfilePage; nextCursor: string | null; count: number | null };
  try {
    page = await meydanApiPage<ApiProfilePage>("/me/profile-page?limit=20", { headers });
  } catch (reason) {
    // Only a missing endpoint (older backend) falls back to the four serial
    // requests; a slow or failing page must not double the wait.
    if (reason instanceof MeydanApiError && (reason.status === 404 || reason.status === 405)) return undefined;
    throw reason;
  }
  const { me, narratives, replies, square_meta: squareMeta, pinned } = page.data;
  if (!me) return undefined;
  // A null page count must not erase the account total the mappers already set.
  const narrativePage = { nextNarrativeCursor: page.nextCursor, ...(page.count != null ? { narrativeCount: page.count } : {}) };
  const social = (me as WithSocial).social;

  if (me.account_type === "user" || me.account_type === "official") {
    return withExtras({ ...mapUser(me.profile, narratives, replies), ...narrativePage }, social, pinned);
  }
  if (me.account_type === "speaker") {
    return withExtras({ ...mapUser(me.profile, narratives, replies, me.speaker || null), ...narrativePage }, social, pinned);
  }
  const entity = me.entity ?? me.square;
  if (!entity) return null;
  return withExtras({
    ...mapSquare(
      { ...entity, start_date: squareMeta?.start_date ?? entity.start_date },
      narratives,
      replies,
      squareMeta ? (squareMeta.media_reflections ?? 0) : undefined,
    ),
    ...narrativePage,
    metaHydrated: true,
  }, social, pinned);
}

async function authenticatedProfile(): Promise<ProfileDetails | null> {
  const headers = await accessTokenHeader();

  if (!headers.Authorization) {
    return null;
  }

  const single = await profileFromSinglePage(headers);
  if (single !== undefined) return single;

  try {
    const me = await meydanApi<ApiMe>("/me", {
      headers,
    });

    let narrativePage = {
      data: [] as ApiNarrative[],
      nextCursor: null as string | null,
      count: null as number | null,
    };

    let replies: ApiComment[] = [];

    try {
      narrativePage = await meydanApiPage<ApiNarrative[]>(
        "/me/narratives?limit=20",
        { headers },
      );
    } catch {
      narrativePage = { data: [], nextCursor: null, count: null };
    }

    const actorId = isEntityKind(me.account_type)
      ? ((me as ApiEntityMe).entity ?? (me as ApiEntityMe).square)?.id
      : (me as Exclude<ApiMe, ApiEntityMe>).profile.id;

    // Speakers are `user` actors everywhere interactions and replies are keyed:
    // `/actors/{type}` accepts `user` and the entity kinds, never `speaker`.
    const actorType: ActorKind = isEntityKind(me.account_type) ? me.account_type : "user";

    if (actorId) {
      try {
        replies = await meydanApi<ApiComment[]>(
          `/actors/${actorType}/${actorId}/replies`,
          {
            headers,
          },
        );
      } catch {
        replies = [];
      }
    }

    if (me.account_type === "user" || me.account_type === "official") {
      return {
        ...mapUser(me.profile, narrativePage.data, replies),
        nextNarrativeCursor: narrativePage.nextCursor,
        ...(narrativePage.count != null ? { narrativeCount: narrativePage.count } : {}),
      };
    }

    if (me.account_type === "speaker") {
      return {
        ...mapUser(me.profile, narrativePage.data, replies, me.speaker || null),
        nextNarrativeCursor: narrativePage.nextCursor,
        ...(narrativePage.count != null ? { narrativeCount: narrativePage.count } : {}),
      };
    }

    const entity = me.entity ?? me.square;
    if (!entity) {
      return null;
    }

    // Media reflections are counted for squares only.
    let mediaReflectionCount: number | undefined;
    if (me.account_type === "square") {
      try {
        const reflectionStats = await meydanApi<ApiMediaReflectionCount>(
          `/squares/${entity.id}/media-reflections/count`,
        );

        mediaReflectionCount = reflectionStats.count ?? 0;
      } catch {
        mediaReflectionCount = 0;
      }
    }

    return {
      ...mapSquare(
        entity,
        narrativePage.data,
        replies,
        mediaReflectionCount,
      ),
      nextNarrativeCursor: narrativePage.nextCursor,
      ...(narrativePage.count != null ? { narrativeCount: narrativePage.count } : {}),
    };
  } catch {
    return null;
  }
}

export async function getProfileDetails(): Promise<ProfileDetails> {
  const profile = await authenticatedProfile();

  if (!profile) {
    throw new Error("برای مشاهده پروفایل وارد شوید.");
  }

  return profile;
}

export async function getPublicProfileDetails(
  type: ActorKind,
  id: number,
): Promise<ProfileDetails | null> {
  try {
    if (isEntityKind(type)) {
      const square = await meydanApi<ApiSquare>(
        `${entityApiPath(type as EntityKind, id)}?defer_counts=1`,
      );
      const summary = mapSquare(square);
      return {
        ...summary,
        social: socialFrom((square as WithSocial).social),
        squareStats: summary.squareStats.map((stat, index) =>
          index === 0 ? { ...stat, value: "…" } : stat,
        ),
        narrativesDeferred: true,
      };
    }

    const [user, narratives] = await Promise.all([
      meydanApi<ApiPublicUser>(`/users/${id}`),
      getPublicNarrativePage(`/users/${id}/narratives?limit=20`),
    ]);
    return {
      ...mapUser(
        {
          id: user.id,
          ...user.profile,
          full_name:
            user.profile.full_name || user.actor.display_name || "کاربر میدان",
          avatar_url: user.actor.avatar_url,
          verified: user.actor.verified,
          verified_speaker: user.actor.verified_speaker,
          is_speaker: user.actor.is_speaker,
          verified_official: user.actor.verified_official,
        },
        narratives.data,
      ),
      nextNarrativeCursor: narratives.nextCursor,
      ...(narratives.count != null ? { narrativeCount: narratives.count } : {}),
      social: socialFrom(user.social),
      pinnedPost: narratives.meta?.pinned ? mapNarrativePost(narratives.meta.pinned as ApiNarrative, { name: user.profile.full_name || user.actor.display_name || "کاربر میدان", handle: "", subtitle: "", location: "", verified: Boolean(user.actor.verified) }) : null,
    };
  } catch {
    return null;
  }
}
