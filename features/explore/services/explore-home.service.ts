import { meydanApi, plainText } from "@/lib/meydan-api";
import { actorKindOf, publicProfileHref, type ActorKind } from "@/lib/profile-route";

type ApiActor = {
  id: string;
  type?: string;
  handle?: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
  verified_speaker?: boolean;
  verified_official?: boolean;
  location_address?: string;
};

type ApiNarrative = {
  id: number;
  author?: ApiActor;
  body?: string;
  tags?: string[];
  stats?: { views?: number };
  growth_pct?: number | null;
  viewer_state?: { bookmarked?: boolean } | null;
};

type ApiHome = {
  tags: Array<{ tag: string; count: number; hot: boolean }>;
  hot: ApiNarrative[];
  active: Array<{ actor: ApiActor; members: number; posts: number; live: boolean }>;
  people: Array<{ actor: ApiActor; followers: number; description: string }>;
  entities: Array<{ actor: ApiActor; followers: number; description: string }>;
};

export type ExploreAccount = {
  key: string;
  type: ActorKind;
  id: number;
  name: string;
  handle?: string;
  href: string;
  avatarUrl?: string;
  verified: boolean;
  speaker: boolean;
  official: boolean;
  description: string;
  followers: number;
};

export type ExploreHotNarrative = {
  id: string;
  href: string;
  authorName: string;
  verified: boolean;
  speaker: boolean;
  official: boolean;
  kind: ActorKind;
  tag?: string;
  body: string;
  views: number;
  growth: number | null;
};

export type ExploreHome = {
  tags: Array<{ tag: string; count: number; hot: boolean }>;
  hot: ExploreHotNarrative[];
  active: Array<ExploreAccount & { members: number; live: boolean }>;
  people: ExploreAccount[];
  entities: ExploreAccount[];
};

function account(actor: ApiActor, followers: number, description: string): ExploreAccount | null {
  const id = Number(String(actor.id).match(/(\d+)$/)?.[1] ?? 0);
  if (!id) return null;
  const type = actorKindOf(actor.type);
  return {
    key: `${type}:${id}`,
    type,
    id,
    name: actor.display_name || "حساب",
    handle: actor.handle,
    href: publicProfileHref(type, id, actor.handle),
    avatarUrl: actor.avatar_url || undefined,
    verified: Boolean(actor.verified),
    speaker: Boolean(actor.verified_speaker),
    official: Boolean(actor.verified_official),
    description: description || actor.location_address || "",
    followers,
  };
}

const present = <T,>(value: T | null): value is T => value !== null;

/** The whole explore landing in one cached read. */
export async function getExploreHome(): Promise<ExploreHome> {
  const home = await meydanApi<ApiHome>("/explore/home");
  return {
    tags: home.tags ?? [],
    hot: (home.hot ?? []).map((item) => ({
      id: String(item.id),
      href: `/posts/${item.id}`,
      authorName: item.author?.display_name || "روایت میدان",
      verified: Boolean(item.author?.verified),
      speaker: Boolean(item.author?.verified_speaker),
      official: Boolean(item.author?.verified_official),
      kind: actorKindOf(item.author?.type),
      tag: item.tags?.[0],
      body: plainText(item.body || "").replace(/\s+/g, " ").trim().slice(0, 160),
      views: Number(item.stats?.views ?? 0),
      growth: item.growth_pct ?? null,
    })),
    active: (home.active ?? []).map((row) => {
      const base = account(row.actor, row.members, "");
      return base ? { ...base, members: row.members, live: row.live } : null;
    }).filter(present),
    people: (home.people ?? []).map((row) => account(row.actor, row.followers, row.description)).filter(present),
    entities: (home.entities ?? []).map((row) => account(row.actor, row.followers, row.description)).filter(present),
  };
}
