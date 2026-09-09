import { meydanApi, plainText } from "@/lib/meydan-api";
import type { MediaReflection, PostComment, PostDetail, PostMedia } from "../types";

type ApiActor = { id: string; display_name: string; avatar_url?: string; verified?: boolean };
type ApiAttachment = { id: number; type?: string; label?: string; filename?: string; url?: string; width?: number; height?: number };
type ApiReflection = { id: number; outlet: string; title?: string; summary?: string };
type ApiNarrative = {
  id: number;
  author: ApiActor;
  body: string;
  published_at?: string | null;
  attachments?: ApiAttachment[];
  tags?: string[];
  media_reflections?: ApiReflection[];
  stats?: { likes?: number; reposts?: number; comments?: number; views?: number };
  viewer_state?: { liked?: boolean; reposted?: boolean } | null;
};
type ApiComment = {
  id: number;
  author?: ApiActor | null;
  body: string;
  created_at?: string | null;
};

function relativeFa(value?: string | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(1, Math.round((Date.now() - then) / 60000));
  const n = new Intl.NumberFormat("fa-IR");
  if (minutes < 60) return `${n.format(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${n.format(hours)} ساعت پیش` : `${n.format(Math.round(hours / 24))} روز پیش`;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join(".");
}

function mediaKind(type?: string): PostMedia["kind"] {
  if (type === "image") return "image";
  if (type === "video") return "video";
  return "article";
}

function accent(index: number): MediaReflection["accent"] {
  return (["blue", "emerald", "amber", "red"] as const)[index % 4];
}

export async function getPostById(postId: string): Promise<PostDetail | null> {
  if (!/^\d+$/.test(postId)) return null;

  try {
    const post = await meydanApi<ApiNarrative>(`/narratives/${postId}`);
    let comments: ApiComment[] = [];
    try {
      comments = await meydanApi<ApiComment[]>(`/narratives/${postId}/comments`);
    } catch {
      comments = [];
    }

    const authorName = post.author?.display_name || "میدان";
    return {
      id: String(post.id),
      author: {
        name: authorName,
        handle: post.author?.id || "meydan",
        initials: initials(authorName),
        verified: Boolean(post.author?.verified),
        avatarUrl: post.author?.avatar_url,
      },
      outlet: post.media_reflections?.[0]?.outlet || "روایت میدان",
      badge: post.tags?.[0] || "روایت میدان",
      timeAgo: relativeFa(post.published_at),
      body: plainText(post.body || ""),
      media: (post.attachments || []).map((item) => ({
        id: String(item.id),
        label: item.label || item.filename || "پیوست",
        kind: mediaKind(item.type),
        detail: item.type || "فایل",
        previewSrc: item.type === "image" || item.type === "video" ? item.url : undefined,
        previewAlt: item.label || authorName,
        width: item.width,
        height: item.height,
      })),
      reflections: (post.media_reflections || []).map((item, index) => ({
        id: String(item.id),
        outlet: item.outlet,
        summary: item.summary || item.title || "",
        accent: accent(index),
      })),
      likes: post.stats?.likes || 0,
      reposts: post.stats?.reposts || 0,
      views: post.stats?.views || 0,
      commentsCount: post.stats?.comments || 0,
      viewerState: { liked: Boolean(post.viewer_state?.liked), reposted: Boolean(post.viewer_state?.reposted) },
      comments: comments.map((item): PostComment => {
        const name = item.author?.display_name || "کاربر میدان";
        return {
          id: String(item.id),
          author: name,
          initials: initials(name),
          timeAgo: relativeFa(item.created_at),
          content: plainText(item.body || ""),
          isAuthor: item.author?.id === post.author?.id,
          avatarUrl: item.author?.avatar_url,
        };
      }),
    };
  } catch {
    return null;
  }
}
