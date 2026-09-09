import { plainText } from "@/lib/meydan-api";
import type { FeedAttachment, FeedPost, FollowSuggestion } from "../types";

export type ApiActor = {
  id: string;
  type: "user" | "square";
  display_name: string;
  verified?: boolean;
};

export type ApiAttachment = {
  id: number;
  type?: string;
  label?: string;
  filename?: string;
  url?: string;
};

export type ApiNarrative = {
  id: number;
  author: ApiActor;
  body: string;
  published_at?: string | null;
  attachments?: ApiAttachment[];
  tags?: string[];
  initiative?: { id?: number; cta_label?: string } | null;
  media_reflections?: Array<{ outlet: string; title: string }>;
  stats?: { likes?: number; comments?: number; reposts?: number };
  viewer_state?: { liked?: boolean; reposted?: boolean } | null;
};

export type ApiSquare = {
  id: number;
  name: string;
  description?: string;
  handle?: string;
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
  const parts = address.split(/[،,]/).map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || "";
}

export function buildSquareMap(squares: ApiSquare[]): Map<string, ApiSquare> {
  return new Map(squares.map((square) => [`sq_${square.id}`, square] as const));
}

export function mapNarrative(item: ApiNarrative, squares: Map<string, ApiSquare>): FeedPost {
  const reflection = item.media_reflections?.[0];
  const visual = item.attachments?.some((attachment) => attachment.type === "image" || attachment.type === "video");
  const square = squares.get(item.author?.id || "");
  const actorId = item.author?.type === "square"
    ? Number(String(item.author.id).replace(/^sq_/, ""))
    : Number(String(item.author?.id || "").replace(/^u_/, ""));

  return {
    id: String(item.id),
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
      previewSrc: attachment.type === "image" || attachment.type === "video" ? attachment.url : undefined,
      previewAlt: attachment.type === "image" || attachment.type === "video" ? attachment.label || item.author?.display_name : undefined,
    })),
    mediaReflection: reflection ? { outlet: reflection.outlet, headline: reflection.title } : undefined,
    stats: {
      likes: item.stats?.likes || 0,
      comments: item.stats?.comments || 0,
      reposts: item.stats?.reposts || 0,
    },
    callToAction: item.initiative?.cta_label || undefined,
    initiativeId: item.initiative?.id ? String(item.initiative.id) : undefined,
    actor: Number.isFinite(actorId) && actorId > 0 ? { type: item.author.type, id: String(actorId) } : undefined,
    viewerState: {
      liked: Boolean(item.viewer_state?.liked),
      reposted: Boolean(item.viewer_state?.reposted),
    },
  };
}

export function mapFollowSuggestion(square: ApiSquare): FollowSuggestion {
  return {
    id: String(square.id),
    actorType: "square",
    name: square.name,
    city: cityFromAddress(square.location?.address),
    handle: square.handle || `square_${square.id}`,
    description: square.description || "پایگاه فعال میدان",
  };
}
