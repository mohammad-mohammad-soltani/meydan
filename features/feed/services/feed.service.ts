import { meydanApi, meydanApiPage, plainText } from "@/lib/meydan-api";
import type { FeedAttachment, FeedPost, FollowSuggestion } from "../types";
import { mapQuotedNarrative, type ApiQuotedNarrative } from "./quote-mapper";

type ApiActor = {
  id: string;
  type: "user" | "square";
  display_name: string;
  avatar_url?: string;
  handle?: string;
  location_address?: string;
  verified?: boolean;
  verified_speaker?: boolean;
  verified_official?: boolean;
};

type ApiAttachment = {
  id: number;
  type?: string;
  label?: string;
  filename?: string;
  url?: string;
  /** Still image for a video attachment; the backend may name it either way. */
  poster_url?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
};

type ApiNarrative = {
  id: number;
  author: ApiActor;
  body: string;
  published_at?: string | null;
  attachments?: ApiAttachment[];
  tags?: string[];
  initiative?: {
    id?: number;
    cta_label?: string;
    participant_count?: number;
    viewer_state?: { joined?: boolean };
  } | null;
  media_reflections?: Array<{ outlet: string; title: string; url?: string }>;
  stats?: { likes?: number; comments?: number; reposts?: number; quotes?: number; views?: number };
  quoted_narrative?: ApiQuotedNarrative;
  viewer_state?: { liked?: boolean; reposted?: boolean; can_delete?: boolean } | null;
};

type ApiSquare = {
  id: number;
  name: string;
  description?: string;
  handle?: string;
  avatar_url?: string;
  verified?: boolean;
  location?: { address?: string } | null;
  stats?: { narratives?: number; followers?: number };
};

function relativeFa(value?: string | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(1, Math.round((Date.now() - then) / 60000));
  const n = new Intl.NumberFormat("fa-IR");
  if (minutes < 60) return `${n.format(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${n.format(hours)} ساعت پیش`;
  return `${n.format(Math.round(hours / 24))} روز پیش`;
}

function iconFor(type?: string): FeedAttachment["icon"] {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "microphone";
  return "article";
}

function cityFromAddress(address?: string): string {
  if (!address) return "";
  const parts = address
    .split(/[،,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || "";
}

function numericActorId(value?: string): number {
  const match = (value || "").match(/(?:sq_|u_)?(\d+)$/);
  return Number(match?.[1] || 0);
}

function mediaReflectionOutlets(reflections: NonNullable<ApiNarrative["media_reflections"]>): string[] {
  return Array.from(
    new Set(
      reflections
        .map((reflection) => reflection.outlet?.trim())
        .filter((outlet): outlet is string => Boolean(outlet)),
    ),
  );
}

function mediaReflectionSummary(outlets: string[]): string {
  if (!outlets.length) return "";

  if (outlets.length === 1) {
    return `بازنشر شده در ${outlets[0]}`;
  }

  if (outlets.length === 2) {
    return `بازنشر شده در ${outlets[0]} و ${outlets[1]}`;
  }

  if (outlets.length === 3) {
    return `بازنشر شده در ${outlets[0]}، ${outlets[1]} و ${outlets[2]}`;
  }

  return `بازنشر شده در ${outlets[0]}، ${outlets[1]}، ${outlets[2]} و ${(outlets.length - 3).toLocaleString("fa-IR")} رسانه دیگر`;
}

function mapNarrative(item: ApiNarrative): FeedPost {
  const reflections = item.media_reflections || [];
  const reflection = reflections[0];
  const reflectionOutlets = mediaReflectionOutlets(reflections);
  const reflectionSummary = mediaReflectionSummary(reflectionOutlets);
  const visual = item.attachments?.some(
    (attachment) => attachment.type === "image" || attachment.type === "video",
  );

  return {
    id: String(item.id),
    author: {
      id: numericActorId(item.author?.id),
      type: item.author?.type || "square",
      avatarUrl: item.author?.avatar_url,
      verified: Boolean(item.author?.verified),
      verifiedSpeaker: Boolean(item.author?.verified_speaker),
      verifiedOfficial: Boolean(item.author?.verified_official),
    },
    initiativeId: item.initiative?.id,
    initiativeParticipantCount: item.initiative?.participant_count,
    viewerState: {
      liked: Boolean(item.viewer_state?.liked),
      reposted: Boolean(item.viewer_state?.reposted),
      joined: Boolean(item.initiative?.viewer_state?.joined),
      canDelete: Boolean(item.viewer_state?.can_delete),
    },
    kind: visual || reflection ? "media" : "ideas",
    squareName: item.author?.display_name || "میدان",
    handle: item.author?.handle || item.author?.id || "meydan",
    timeAgo: relativeFa(item.published_at),
    city: cityFromAddress(item.author?.location_address),
    badge: item.tags?.[0] || "روایت میدان",
    title: item.author?.display_name || "روایت میدان",
    body: plainText(item.body || ""),
    attachments: (item.attachments || []).map((attachment) => ({
      id: String(attachment.id),
      label: attachment.label || attachment.filename || "پیوست",
      detail: attachment.type || "فایل",
      icon: iconFor(attachment.type),
      previewSrc:
        attachment.type === "image" || attachment.type === "video"
          ? attachment.url
          : undefined,
      posterSrc:
        attachment.type === "video"
          ? attachment.poster_url || attachment.thumbnail_url
          : undefined,
      audioSrc: attachment.type === "audio" ? attachment.url : undefined,
      previewAlt:
        attachment.type === "image" || attachment.type === "video"
          ? attachment.label || item.author?.display_name
          : undefined,
      width: attachment.width,
      height: attachment.height,
    })),
    mediaReflection: reflection
      ? {
          outlet: reflection.outlet,
          outlets: reflectionOutlets,
          headline: reflectionSummary || reflection.title,
          url: reflections.length === 1 ? reflection.url : undefined,
        }
      : undefined,
    stats: {
      likes: item.stats?.likes || 0,
      comments: item.stats?.comments || 0,
      reposts: item.stats?.reposts || 0,
      quotes: item.stats?.quotes || 0,
      views: item.stats?.views || 0,
    },
    quote: mapQuotedNarrative(item.quoted_narrative),
    callToAction: item.initiative?.cta_label || undefined,
  };
}

/** Pages stay small enough for media prefetching without loading a large feed at once. */
export const FEED_PAGE_SIZE = 12;

export type FeedQuery = {
  mode?: "for_you" | "following";
  filter?: string;
  cursor?: string | null;
  limit?: number;
};

export type FeedPage = {
  posts: FeedPost[];
  /** `null` once the backend snapshot has no further timeline page. */
  nextCursor: string | null;
};

export async function getFeedPage(
  query: FeedQuery = {},
  init?: RequestInit,
): Promise<FeedPage> {
  const params = new URLSearchParams({
    mode: query.mode || "for_you",
    filter: query.filter || "all",
    limit: String(query.limit ?? FEED_PAGE_SIZE),
  });
  if (query.cursor) params.set("cursor", query.cursor);

  const page = await meydanApiPage<ApiNarrative[]>(`/timeline?${params}`, init);

  return {
    posts: page.data.map(mapNarrative),
    nextCursor: page.nextCursor,
  };
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  const squares = await meydanApi<ApiSquare[]>("/squares?verified=1&limit=6");
  return squares.slice(0, 6).map((square) => ({
    id: String(square.id),
    actorType: "square",
    name: square.name,
    city: cityFromAddress(square.location?.address),
    handle: square.handle || `square_${square.id}`,
    description: square.description || "پایگاه فعال میدان",
    avatarUrl: square.avatar_url || undefined,
    verified: Boolean(square.verified),
    narrativeCount: square.stats?.narratives,
    followerCount: square.stats?.followers,
  }));
}

/** The narratives that quote `postId`, newest first. */
export async function getQuotesPage(
  postId: string,
  cursor: string | null = null,
  init?: RequestInit,
): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: String(FEED_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);

  const page = await meydanApiPage<ApiNarrative[]>(`/narratives/${postId}/quotes?${params}`, init);

  return {
    posts: page.data.map(mapNarrative),
    nextCursor: page.nextCursor,
  };
}
