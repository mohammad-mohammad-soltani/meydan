import { meydanApi, plainText } from "@/lib/meydan-api";
import type { FeedAttachment, FeedPost, FollowSuggestion } from "../types";

type ApiActor = {
  id: string;
  type: "user" | "square";
  display_name: string;
  avatar_url?: string;
  verified?: boolean;
};

type ApiAttachment = {
  id: number;
  type?: string;
  label?: string;
  filename?: string;
  url?: string;
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
  media_reflections?: Array<{ outlet: string; title: string }>;
  stats?: { likes?: number; comments?: number; reposts?: number; views?: number };
  viewer_state?: { liked?: boolean; reposted?: boolean } | null;
};

type ApiSquare = {
  id: number;
  name: string;
  description?: string;
  handle?: string;
  avatar_url?: string;
  location?: { address?: string } | null;
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

function mapNarrative(item: ApiNarrative, squares: Map<string, ApiSquare>): FeedPost {
  const reflection = item.media_reflections?.[0];
  const visual = item.attachments?.some(
    (attachment) => attachment.type === "image" || attachment.type === "video",
  );
  const square = squares.get(item.author?.id || "");

  return {
    id: String(item.id),
    author: {
      id: numericActorId(item.author?.id),
      type: item.author?.type || "square",
      avatarUrl: square?.avatar_url || item.author?.avatar_url,
      verified: Boolean(item.author?.verified),
    },
    initiativeId: item.initiative?.id,
    initiativeParticipantCount: item.initiative?.participant_count,
    viewerState: {
      liked: Boolean(item.viewer_state?.liked),
      reposted: Boolean(item.viewer_state?.reposted),
      joined: Boolean(item.initiative?.viewer_state?.joined),
    },
    kind: visual || reflection ? "media" : "ideas",
    squareName: item.author?.display_name || "میدان",
    handle: square?.handle || item.author?.id || "meydan",
    timeAgo: relativeFa(item.published_at),
    city: cityFromAddress(square?.location?.address),
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
      previewAlt:
        attachment.type === "image" || attachment.type === "video"
          ? attachment.label || item.author?.display_name
          : undefined,
      width: attachment.width,
      height: attachment.height,
    })),
    mediaReflection: reflection
      ? { outlet: reflection.outlet, headline: reflection.title }
      : undefined,
    stats: {
      likes: item.stats?.likes || 0,
      comments: item.stats?.comments || 0,
      reposts: item.stats?.reposts || 0,
      views: item.stats?.views || 0,
    },
    callToAction: item.initiative?.cta_label || undefined,
  };
}

async function getSquares(): Promise<ApiSquare[]> {
  return meydanApi<ApiSquare[]>("/squares");
}

export type FeedQuery = { mode?: "for_you" | "following"; filter?: string; cursor?: string | null };

function apiFilter(filter?: string): string {
  if (filter === "ideas") return "initiatives";
  if (filter === "media") return "reflected";
  return "all";
}

export async function getFeedPosts(query: FeedQuery = {}): Promise<FeedPost[]> {
  const params = new URLSearchParams({ mode: query.mode || "for_you", filter: apiFilter(query.filter) });
  if (query.cursor) params.set("cursor", query.cursor);
  const [narratives, squares] = await Promise.all([
    meydanApi<ApiNarrative[]>(`/timeline?${params}`),
    getSquares(),
  ]);
  const squareMap = new Map(
    squares.map((square) => [`sq_${square.id}`, square] as const),
  );
  return narratives.map((item) => mapNarrative(item, squareMap));
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  const squares = await meydanApi<ApiSquare[]>("/squares?verified=1");
  return squares.slice(0, 6).map((square) => ({
    id: String(square.id),
    actorType: "square",
    name: square.name,
    city: cityFromAddress(square.location?.address),
    handle: square.handle || `square_${square.id}`,
    description: square.description || "پایگاه فعال میدان",
  }));
}
