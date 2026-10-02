import { meydanApi } from "@/lib/meydan-api";
import type { FeedPost } from "@/features/feed/types";
import type { ActorKind } from "@/lib/profile-route";

type ApiReportDay = {
  date: string;
  night_number: number;
  report_count: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  text_color?: string | null;
  background_color?: string | null;
};

export type ReportDay = {
  date: string;
  nightNumber: number;
  reportCount: number;
  title: string;
  subtitle: string;
  description: string;
  textColor: string | null;
  backgroundColor: string | null;
};

export type ReportDayDetail = {
  day: ReportDay;
  items: FeedPost[];
};

export function mapReportDay(row: ApiReportDay): ReportDay {
  return {
    date: row.date,
    nightNumber: Number(row.night_number),
    reportCount: Number(row.report_count),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    description: String(row.description ?? ""),
    textColor: row.text_color ?? null,
    backgroundColor: row.background_color ?? null,
  };
}

export async function getReportDays(): Promise<ReportDay[]> {
  return (await meydanApi<ApiReportDay[]>("/report-days")).map(mapReportDay);
}

export async function getReportDay(
  date: string
): Promise<ReportDayDetail | null> {
  try {
    const payload = await meydanApi<{
      day: ApiReportDay;
      items: Array<ApiContent>;
    }>(`/report-days/${date}`);

    return {
      day: mapReportDay(payload.day),
      items: payload.items.map(toFeedPost),
    };
  } catch (error) {
    if ((error as { status?: number })?.status === 404) {
      return null;
    }

    throw error;
  }
}

type ApiActor = {
  id?: string;
  type?: ActorKind;
  handle?: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
  verified_speaker?: boolean;
  verified_official?: boolean;
};

type ApiNarrative = {
  id: number;
  author?: ApiActor;
  body?: string;
  published_at?: string | null;
  attachments?: Array<{
    id: number;
    type?: string;
    label?: string;
    filename?: string;
    url?: string;
    poster_url?: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  }>;
  stats?: {
    likes?: number;
    reposts?: number;
    comments?: number;
    views?: number;
  };
};

type ApiContent = {
  id: number;
  title: string;
  excerpt?: string;
  body?: string;
  source_narrative_id?: number | null;
  producer?: {
    display_name?: string;
    name?: string;
    avatar_url?: string | null;
  } | null;
  source_narrative?: ApiNarrative | null;
};

function actorId(value?: string) {
  const match = (value || "").match(/(\d+)$/);
  return Number(match?.[1] || 0);
}

function relative(value?: string | null) {
  if (!value) return "";

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60000)
  );

  const n = new Intl.NumberFormat("fa-IR");

  return minutes < 60
    ? `${n.format(minutes)} دقیقه پیش`
    : `${n.format(Math.round(minutes / 60))} ساعت پیش`;
}

function toFeedPost(item: ApiContent): FeedPost {
  const source = item.source_narrative;
  const author = source?.author;

  const id = String(
    source?.id || item.source_narrative_id || item.id
  );

  const authorName =
    author?.display_name ||
    item.producer?.display_name ||
    item.producer?.name ||
    "میدان";

  return {
    id,

    author: {
      id: actorId(author?.id),
      type: author?.type || "user",
      avatarUrl:
        author?.avatar_url ||
        item.producer?.avatar_url ||
        undefined,
      verified: Boolean(author?.verified),
      verifiedSpeaker: Boolean(author?.verified_speaker),
      verifiedOfficial: Boolean(author?.verified_official),
    },

    viewerState: {
      liked: false,
      reposted: false,
      joined: false,
    },

    kind: "media",

    squareName: authorName,

    handle: author?.id || "meydan",

    timeAgo: relative(source?.published_at),

    city: "تهران",

    badge: "گزارش",

    title: authorName || item.title,

    body:
      source?.body ||
      item.body ||
      item.excerpt ||
      "",

    attachments: (source?.attachments || []).map((media) => ({
      id: String(media.id),
      label:
        media.label ||
        media.filename ||
        "پیوست",
      detail:
        media.type ||
        "فایل",
      icon:
        media.type === "video"
          ? "video"
          : media.type === "audio"
          ? "microphone"
          : media.type === "image"
          ? "image"
          : "article",
      previewSrc:
        media.type === "image" ||
        media.type === "video"
          ? media.url
          : undefined,
      posterSrc:
        media.type === "video"
          ? media.poster_url || media.thumbnail_url
          : undefined,
      audioSrc:
        media.type === "audio"
          ? media.url
          : undefined,
      previewAlt:
        media.label || item.title,
      width: media.width,
      height: media.height,
    })),

    stats: {
      likes: source?.stats?.likes || 0,
      reposts: source?.stats?.reposts || 0,
      comments: source?.stats?.comments || 0,
      views: source?.stats?.views || 0,
    },
  };
}

/**
 * Night numbers are calendar days in Tehran,
 * with 10 Esfand 1404 as night 1.
 */
export function currentReportNight(): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(
      parts.find((part) => part.type === type)?.value ?? 0
    );

  return (
    Math.floor(
      (
        Date.UTC(
          value("year"),
          value("month") - 1,
          value("day")
        ) -
        Date.UTC(2026, 2, 1)
      ) / 86_400_000
    ) + 1
  );
}