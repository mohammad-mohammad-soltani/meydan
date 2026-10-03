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

function narrativeMetric(item: ApiNarrative): string {
  const views = Number(item.stats?.views || 0);
  if (views > 0) return `${compactFa(views)} بازدید`;

  const reactions = Number(item.stats?.likes || 0) + Number(item.stats?.comments || 0);
  if (reactions > 0) return `${compactFa(reactions)} واکنش`;

  return "روایت تازه";
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
 * `/explore/trends` answers with rows.
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

/**
 * The hot hashtags of the last week, from the one cached explore read (the same
 * request the explore page makes), shown as «#tag · N روایت» like the reference.
 */
async function tagTrends(signal?: AbortSignal): Promise<HotTrend[]> {
  const home = await meydanApi<{ tags?: Array<{ tag: string; count: number; hot: boolean }> }>("/explore/home", { signal });
  return (home?.tags ?? []).slice(0, 6).map((entry, index) => ({
    id: `tag-${entry.tag}`,
    rank: index + 1,
    context: entry.hot ? "داغ" : "ترند",
    title: `#${entry.tag}`,
    metric: `${compactFa(entry.count)} روایت`,
    href: `/explore?q=${encodeURIComponent(`#${entry.tag}`)}`,
  }));
}

export async function getHotTrends(signal?: AbortSignal): Promise<HotTrend[]> {
  try {
    const tags = await tagTrends(signal);
    if (tags.length) return tags;
  } catch (reason) {
    if (isAbortError(reason)) throw reason;
  }
  // Older backends without /explore/home: the narrative-based board as before.

  const hot = await meydanApi<TrendsResponse>(
    `/explore/trends?window=${TREND_WINDOW}`,
    { signal },
  );
  const hotTrends = asList<ApiNarrative>(hot?.items).slice(0, TREND_LIMIT).map(mapNarrative);
  if (hotTrends.length) return hotTrends;

  return timelineTrends(signal);
}
