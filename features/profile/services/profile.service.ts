import { isAuthApiError, meydanApi, meydanApiPage } from "@/lib/meydan-api";
import { accessTokenHeader } from "@/lib/meydan-session";
import type { FeedPost } from "@/features/feed/types";
import type { ProfileDetails } from "../types";
import type {
  ApiComment,
  ApiMe,
  ApiMediaReflectionCount,
  ApiNarrative,
  ApiPublicUser,
  ApiSquare,
} from "./profile-api-types";
import { mapNarrativePost } from "./profile-narrative-mappers";
import { mapSquare } from "./profile-square-mapper";
import { mapUser } from "./profile-user-mapper";

export async function getProfileNarrativePage(
  type: "user" | "square",
  id: number,
  identity: ProfileDetails["identity"],
  cursor?: string | null,
  own = false,
): Promise<{
  posts: FeedPost[];
  nextCursor: string | null;
  count: number | null;
}> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const path = own
    ? "/me/narratives"
    : `/${type === "square" ? "squares" : "users"}/${id}/narratives`;
  const page = own
    ? await meydanApiPage<ApiNarrative[]>(`${path}?${params}`, {
        headers: await accessTokenHeader(),
      })
    : await getPublicNarrativePage(`${path}?${params}`);
  return {
    posts: page.data.map((item) => mapNarrativePost(item, identity)),
    nextCursor: page.nextCursor,
    count: page.count,
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
};

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
  } catch {
    return undefined;
  }
  const { me, narratives, replies, square_meta: squareMeta } = page.data;
  if (!me) return undefined;
  const narrativePage = { nextNarrativeCursor: page.nextCursor, narrativeCount: page.count };

  if (me.account_type === "user" || me.account_type === "official") {
    return { ...mapUser(me.profile, narratives, replies), ...narrativePage };
  }
  if (me.account_type === "speaker") {
    return { ...mapUser(me.profile, narratives, replies, me.speaker || null), ...narrativePage };
  }
  if (!me.square) return null;
  return {
    ...mapSquare(
      { ...me.square, start_date: squareMeta?.start_date ?? me.square.start_date },
      narratives,
      replies,
      squareMeta?.media_reflections ?? 0,
    ),
    ...narrativePage,
    metaHydrated: true,
  };
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

    const actorId =
      me.account_type === "square" ? me.square?.id : me.profile.id;

    // Speakers are `user` actors everywhere interactions and replies are keyed:
    // `/actors/{type}` only accepts `user|square`, never `speaker`.
    const actorType = me.account_type === "square" ? "square" : "user";

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
        narrativeCount: narrativePage.count,
      };
    }

    if (me.account_type === "speaker") {
      return {
        ...mapUser(me.profile, narrativePage.data, replies, me.speaker || null),
        nextNarrativeCursor: narrativePage.nextCursor,
        narrativeCount: narrativePage.count,
      };
    }

    if (!me.square) {
      return null;
    }

    let mediaReflectionCount = 0;

    try {
      const reflectionStats = await meydanApi<ApiMediaReflectionCount>(
        `/squares/${me.square.id}/media-reflections/count`,
      );

      mediaReflectionCount = reflectionStats.count ?? 0;
    } catch {
      mediaReflectionCount = 0;
    }

    return {
      ...mapSquare(
        me.square,
        narrativePage.data,
        replies,
        mediaReflectionCount,
      ),
      nextNarrativeCursor: narrativePage.nextCursor,
      narrativeCount: narrativePage.count,
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
  type: "user" | "square",
  id: number,
): Promise<ProfileDetails | null> {
  try {
    if (type === "square") {
      const square = await meydanApi<ApiSquare>(
        `/squares/${id}?defer_counts=1`,
      );
      const summary = mapSquare(square);
      return {
        ...summary,
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
      narrativeCount: narratives.count,
    };
  } catch {
    return null;
  }
}
