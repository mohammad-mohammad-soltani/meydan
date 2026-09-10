import { meydanApi, plainText } from "@/lib/meydan-api";
import type {
  ExploreFilter,
  ExploreLanding,
  ExploreResult,
  ExploreResultKind,
  ExploreTrend,
} from "../types";

type ApiActor = {
  id: string;
  type?: "user" | "square";
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
};

type ApiAttachment = {
  id: number;
  type?: string;
  url?: string;
  label?: string;
};

type ApiNarrative = {
  id: number;
  author?: ApiActor;
  body?: string;
  published_at?: string | null;
  tags?: string[];
  attachments?: ApiAttachment[];
  stats?: {
    likes?: number;
    comments?: number;
    reposts?: number;
    views?: number;
  };
};

type ApiSquare = {
  id: number;
  name?: string;
  description?: string;
  avatar_url?: string;
  verified?: boolean;
  location?: {
    address?: string;
    province_id?: number;
    city_id?: number;
  } | null;
};

type ApiCreator = {
  id: number;
  name?: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
  verified?: boolean;
};

type ApiContent = {
  id: number;
  title?: string;
  excerpt?: string;
  body?: string;
  format?: string;
  featured?: boolean;
  attachments?: ApiAttachment[];
  creators?: Array<{ id?: number; name?: string; avatar_url?: string }>;
  tags?: string[];
};

type ApiTopic = {
  id: number;
  name?: string;
  slug?: string;
};

type ExploreSearchResponse = {
  sections?: {
    narratives?: ApiNarrative[];
    squares?: ApiSquare[];
    users?: ApiActor[];
    content?: ApiContent[];
    creators?: ApiCreator[];
    topics?: ApiTopic[];
  };
};

type ExploreSuggestionsResponse = {
  nearby_squares?: ApiSquare[];
  creators?: ApiCreator[];
  content?: ApiContent[];
  topics?: ApiTopic[];
  recommended_actors?: ApiActor[];
};

type ExploreTrendsResponse = {
  window?: string;
  items?: ApiNarrative[];
};

const apiTypeByFilter: Partial<Record<ExploreFilter, string>> = {
  narrative: "narrative",
  square: "square",
  creator: "creator",
  content: "content",
  user: "user",
  topic: "topic",
};

function normalizeQuery(value: string): string {
  return value
    .trim()
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/\s+/g, " ");
}

function actorNumericId(value?: string): number {
  const match = (value || "").match(/(?:sq_|usr_|u_)?(\d+)$/);
  return Number(match?.[1] || 0);
}

function actorHref(actor?: ApiActor): string {
  const id = actorNumericId(actor?.id);
  if (!id) return "/profile";
  return `/profile/${actor?.type === "square" ? "square" : "user"}/${id}`;
}

function firstVisual(attachments?: ApiAttachment[]): string | undefined {
  return attachments?.find(
    (attachment) =>
      (attachment.type === "image" || attachment.type === "video") &&
      attachment.url,
  )?.url;
}

function compactBody(value?: string, fallback = "نتیجه جست‌وجو"): string {
  const text = plainText(value || "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 150 ? `${text.slice(0, 147)}…` : text;
}

function mapNarrative(item: ApiNarrative): ExploreResult {
  const authorName = item.author?.display_name || "روایت میدان";
  const body = compactBody(item.body, "روایت منتشرشده در میدان");

  return {
    id: `narrative-${item.id}`,
    entityId: String(item.id),
    kind: "narrative",
    title: authorName,
    subtitle: body,
    href: `/posts/${item.id}`,
    avatarUrl: item.author?.avatar_url,
    imageUrl: firstVisual(item.attachments),
    verified: Boolean(item.author?.verified),
    meta: item.tags?.[0] ? `#${item.tags[0]}` : "روایت",
  };
}

function mapSquare(item: ApiSquare): ExploreResult {
  return {
    id: `square-${item.id}`,
    entityId: String(item.id),
    kind: "square",
    title: item.name || "میدان",
    subtitle: item.location?.address || item.description || "میدان فعال",
    href: `/profile/square/${item.id}`,
    avatarUrl: item.avatar_url,
    verified: item.verified ?? true,
    meta: "میدان",
  };
}

function mapCreator(item: ApiCreator): ExploreResult {
  return {
    id: `creator-${item.id}`,
    entityId: String(item.id),
    kind: "creator",
    title: item.name || "سخنران",
    subtitle: item.role || compactBody(item.bio, "سخنران و تولیدکننده محتوا"),
    href: "/speakers",
    avatarUrl: item.avatar_url,
    verified: Boolean(item.verified),
    meta: "سخنران",
  };
}

function mapContent(item: ApiContent): ExploreResult {
  const creator = item.creators?.[0];

  return {
    id: `content-${item.id}`,
    entityId: String(item.id),
    kind: "content",
    title: item.title || "محتوای میدان",
    subtitle: compactBody(item.excerpt || item.body, creator?.name || "محتوای میدان"),
    href: `/content/${item.id}`,
    avatarUrl: creator?.avatar_url,
    imageUrl: firstVisual(item.attachments),
    meta: item.format || "محتوا",
  };
}

function mapUser(item: ApiActor): ExploreResult {
  const id = actorNumericId(item.id);

  return {
    id: `user-${item.id}`,
    entityId: String(id || item.id),
    kind: "user",
    title: item.display_name || "کاربر میدان",
    subtitle: "کاربر میدان",
    href: id ? `/profile/user/${id}` : "/profile",
    avatarUrl: item.avatar_url,
    verified: Boolean(item.verified),
    meta: "کاربر",
  };
}

function mapTopic(item: ApiTopic): ExploreResult {
  return {
    id: `topic-${item.id}`,
    entityId: String(item.id),
    kind: "topic",
    title: item.name ? `#${item.name.replace(/^#/, "")}` : "#روایت",
    subtitle: "موضوع در میدان",
    href: "/home",
    meta: "موضوع",
  };
}

function mapRecommendedActor(item: ApiActor): ExploreResult {
  const id = actorNumericId(item.id);
  const kind: ExploreResultKind = item.type === "square" ? "square" : "user";

  return {
    id: `recommended-${item.id}`,
    entityId: String(id || item.id),
    kind,
    title: item.display_name || "پیشنهاد میدان",
    subtitle: kind === "square" ? "میدان پیشنهادی" : "کاربر پیشنهادی",
    href: actorHref(item),
    avatarUrl: item.avatar_url,
    verified: Boolean(item.verified),
    meta: kind === "square" ? "میدان" : "کاربر",
  };
}

export async function searchExplore(
  query: string,
  filter: ExploreFilter = "all",
  signal?: AbortSignal,
): Promise<ExploreResult[]> {
  const q = normalizeQuery(query);
  if (!q) return [];

  const params = new URLSearchParams({ q });
  const apiType = apiTypeByFilter[filter];
  if (apiType) params.set("types", apiType);

  const data = await meydanApi<ExploreSearchResponse>(
    `/explore/search?${params.toString()}`,
    { signal },
  );

  const sections = data.sections || {};

  return [
    ...(sections.narratives || []).map(mapNarrative),
    ...(sections.squares || []).map(mapSquare),
    ...(sections.content || []).map(mapContent),
    ...(sections.creators || []).map(mapCreator),
    ...(sections.users || []).map(mapUser),
    ...(sections.topics || []).map(mapTopic),
  ];
}

export async function getExploreLanding(): Promise<ExploreLanding> {
  const [suggestionsResult, trendsResult] = await Promise.allSettled([
    meydanApi<ExploreSuggestionsResponse>("/explore/suggestions"),
    meydanApi<ExploreTrendsResponse>("/explore/trends?window=24h"),
  ]);

  const suggestions =
    suggestionsResult.status === "fulfilled" ? suggestionsResult.value : {};
  const trends = trendsResult.status === "fulfilled" ? trendsResult.value : {};

  const people = suggestions.recommended_actors?.length
    ? suggestions.recommended_actors.map(mapRecommendedActor)
    : [
        ...(suggestions.nearby_squares || []).map(mapSquare),
        ...(suggestions.creators || []).map(mapCreator),
      ];

  const uniqueSuggestions = Array.from(
    new Map(people.map((item) => [item.href, item])).values(),
  ).slice(0, 8);

  const trendItems: ExploreTrend[] = (trends.items || []).map((item) => ({
    id: String(item.id),
    title: item.author?.display_name || "روایت داغ",
    body: compactBody(item.body, "روایت در حال رشد در میدان"),
    href: `/posts/${item.id}`,
    authorName: item.author?.display_name || "میدان",
    authorAvatar: item.author?.avatar_url,
    verified: Boolean(item.author?.verified),
    tag: item.tags?.[0] ? `#${item.tags[0]}` : undefined,
    meta: `${Number(item.stats?.views || 0).toLocaleString("fa-IR")} بازدید`,
  }));

  return {
    suggestions: uniqueSuggestions,
    content: (suggestions.content || []).map(mapContent).slice(0, 6),
    topics: (suggestions.topics || []).map(mapTopic).slice(0, 10),
    trends: trendItems.slice(0, 10),
  };
}
