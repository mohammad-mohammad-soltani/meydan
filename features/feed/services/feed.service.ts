import { meydanApi, plainText } from "@/lib/meydan-api";
import type { FeedAttachment, FeedPost, FollowSuggestion } from "../types";

type ApiActor = { id: string; type: "user" | "square"; display_name: string; verified?: boolean };
type ApiAttachment = { id: number; type?: string; label?: string; filename?: string; url?: string };
type ApiNarrative = {
  id: number;
  author: ApiActor;
  body: string;
  published_at?: string | null;
  attachments?: ApiAttachment[];
  tags?: string[];
  media_reflections?: Array<{ outlet: string; title: string }>;
  stats?: { likes?: number; comments?: number; reposts?: number };
};
type ApiSquare = { id: number; name: string; description?: string; handle?: string; location?: { address?: string } | null };

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

function mapNarrative(item: ApiNarrative): FeedPost {
  const reflection = item.media_reflections?.[0];
  const visual = item.attachments?.some((a) => a.type === "image" || a.type === "video");
  return {
    id: String(item.id),
    kind: visual || reflection ? "media" : "ideas",
    squareName: item.author?.display_name || "میدان",
    handle: item.author?.id || "meydan",
    timeAgo: relativeFa(item.published_at),
    city: "",
    badge: item.tags?.[0] || "روایت میدان",
    title: item.author?.display_name || "روایت میدان",
    body: plainText(item.body || ""),
    attachments: (item.attachments || []).map((a) => ({
      id: String(a.id),
      label: a.label || a.filename || "پیوست",
      detail: a.type || "فایل",
      icon: iconFor(a.type),
      previewSrc: a.type === "image" ? a.url : undefined,
      previewAlt: a.type === "image" ? a.label || item.author?.display_name : undefined,
    })),
    mediaReflection: reflection ? { outlet: reflection.outlet, headline: reflection.title } : undefined,
    stats: {
      likes: item.stats?.likes || 0,
      comments: item.stats?.comments || 0,
      reposts: item.stats?.reposts || 0,
    },
  };
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  return (await meydanApi<ApiNarrative[]>("/timeline?mode=for_you&filter=all")).map(mapNarrative);
}

export async function getFollowSuggestions(): Promise<FollowSuggestion[]> {
  const squares = await meydanApi<ApiSquare[]>("/squares?verified=1");
  return squares.slice(0, 6).map((square) => ({
    id: String(square.id),
    name: square.name,
    city: square.location?.address || "",
    handle: square.handle || `square_${square.id}`,
    description: square.description || "پایگاه فعال میدان",
  }));
}
