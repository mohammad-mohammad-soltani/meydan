import { compactFa, meydanApi, plainText } from "@/lib/meydan-api";
import type { HotTrend } from "../types";

const TREND_WINDOW = "24h";
const TREND_LIMIT = 5;

type ApiActor = {
  id?: string | number;
  display_name?: string;
};

type ApiNarrative = {
  id: number;
  author?: ApiActor;
  body?: string;
  tags?: string[];
  stats?: {
    likes?: number;
    comments?: number;
    reposts?: number;
    views?: number;
  };
};

type TrendsResponse = {
  window?: string;
  items?: ApiNarrative[];
};

/** Target contract of `GET /trends/hot` — see docs/backend-prompts. */
type CuratedMetric = {
  value?: number;
  label?: string;
};

type CuratedItem = {
  id?: string | number;
  rank?: number;
  context?: string;
  title?: string;
  href?: string;
  metric?: CuratedMetric;
};

type CuratedResponse = {
  window?: string;
  items?: CuratedItem[];
};

/**
 * The trends feeds are advisory: a backend that answers with an object, a
 * single row or `null` must never take the sidebar down with it.
 */
function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const nested = (value as { items?: unknown }).items;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

function isAbortError(reason: unknown): boolean {
  return (
    typeof reason === "object" &&
    reason !== null &&
    (reason as { name?: string }).name === "AbortError"
  );
}

function excerpt(value?: string): string {
  const text = plainText(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "روایت در حال رشد در میدان";
  return text.length > 72 ? `${text.slice(0, 72).trimEnd()}…` : text;
}

/** Only in-app destinations are safe to hand to `next/link`. */
function appHref(value?: string): string {
  const href = (value || "").trim();
  return href.startsWith("/") && !href.startsWith("//") ? href : "/explore";
}

function narrativeMetric(item: ApiNarrative): string {
  const views = Number(item.stats?.views || 0);
  if (views > 0) return `${compactFa(views)} بازدید`;

  const reactions = Number(item.stats?.likes || 0) + Number(item.stats?.comments || 0);
  if (reactions > 0) return `${compactFa(reactions)} واکنش`;

  return "روایت تازه";
}

function mapCurated(item: CuratedItem, index: number): HotTrend | null {
  const title = (item.title || "").trim();
  if (!title) return null;

  const value = Number(item.metric?.value || 0);
  const label = (item.metric?.label || "").trim();
  const rank = Number(item.rank);

  return {
    id: String(item.id ?? `trend-${index}`),
    rank: rank > 0 ? rank : index + 1,
    context: (item.context || "").trim() || "ترند میدانی",
    title,
    metric: value > 0 ? `${compactFa(value)}${label ? ` ${label}` : ""}` : label || "در حال رشد",
    href: appHref(item.href),
  };
}

function mapNarrative(item: ApiNarrative, index: number): HotTrend {
  const tag = (item.tags || []).map((value) => value.trim()).find(Boolean);

  return {
    id: `narrative-${item.id}`,
    rank: index + 1,
    context: tag ? `#${tag}` : item.author?.display_name || "روایت داغ میدانی",
    title: excerpt(item.body),
    metric: narrativeMetric(item),
    href: `/posts/${item.id}`,
  };
}

/**
 * Curated aggregate board from `GET /trends/hot`. Until the backend ships that
 * route the call fails (or answers empty) and we fall through to the narrative
 * trends the app already serves — never to invented data.
 */
async function curatedTrends(signal?: AbortSignal): Promise<HotTrend[] | null> {
  try {
    const data = await meydanApi<CuratedResponse>(
      `/trends/hot?window=${TREND_WINDOW}&limit=${TREND_LIMIT}`,
      { signal },
    );
    const items = asList<CuratedItem>(data?.items)
      .map(mapCurated)
      .filter((item): item is HotTrend => item !== null)
      .slice(0, TREND_LIMIT);
    return items.length ? items : null;
  } catch (reason) {
    if (isAbortError(reason)) throw reason;
    return null;
  }
}

/** Reactions are far rarer than views, so they dominate this score. */
function engagementScore(item: ApiNarrative): number {
  const stats = item.stats || {};
  const reactions =
    Number(stats.likes || 0) +
    Number(stats.comments || 0) * 2 +
    Number(stats.reposts || 0) * 2;
  return reactions * 100 + Number(stats.views || 0);
}

/**
 * Last resort while the backend trends feeds are empty: the most engaging
 * narratives already in the public timeline. This keeps the board populated
 * with real content instead of an apology, and disappears on its own once
 * `/trends/hot` or `/explore/trends` answers with rows.
 */
async function timelineTrends(signal?: AbortSignal): Promise<HotTrend[]> {
  const data = await meydanApi<ApiNarrative[] | { items?: ApiNarrative[] }>(
    "/timeline?mode=for_you&filter=all",
    { signal },
  );

  return asList<ApiNarrative>(data)
    .sort((a, b) => engagementScore(b) - engagementScore(a) || b.id - a.id)
    .slice(0, TREND_LIMIT)
    .map(mapNarrative);
}

export async function getHotTrends(signal?: AbortSignal): Promise<HotTrend[]> {
  const curated = await curatedTrends(signal);
  if (curated) return curated;

  const hot = await meydanApi<TrendsResponse>(
    `/explore/trends?window=${TREND_WINDOW}`,
    { signal },
  );
  const hotTrends = asList<ApiNarrative>(hot?.items).slice(0, TREND_LIMIT).map(mapNarrative);
  if (hotTrends.length) return hotTrends;

  return timelineTrends(signal);
}
