import type { FeedAttachment, QuotedPost } from "../types";

type ApiQuotedAttachment = {
  id: number;
  type?: string;
  label?: string;
  filename?: string;
  url?: string;
  poster_url?: string | null;
  thumbnail_url?: string | null;
  width?: number;
  height?: number;
};

/** The compact embedded narrative the API attaches to a quote. */
export type ApiQuotedNarrative = {
  id: number;
  unavailable?: boolean;
  author?: {
    id: string;
    type?: "user" | "square";
    display_name?: string;
    avatar_url?: string;
    verified?: boolean;
    verified_speaker?: boolean;
    verified_official?: boolean;
  };
  body?: string;
  published_at?: string | null;
  attachments?: ApiQuotedAttachment[];
} | null;

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

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function attachmentIcon(type?: string): FeedAttachment["icon"] {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "microphone";
  return "article";
}

/** Maps the API's embedded quoted narrative; `undefined` for a post that quotes nothing. */
export function mapQuotedNarrative(item: ApiQuotedNarrative | undefined): QuotedPost | undefined {
  if (!item || !item.id) return undefined;
  if (item.unavailable) return { id: String(item.id), unavailable: true };

  const authorId = Number((item.author?.id || "").match(/(\d+)$/)?.[1] || 0);
  const name = item.author?.display_name || "میدان";

  return {
    id: String(item.id),
    unavailable: false,
    author: {
      id: authorId,
      type: item.author?.type || "square",
      name,
      avatarUrl: item.author?.avatar_url || undefined,
      verified: Boolean(item.author?.verified),
      verifiedSpeaker: Boolean(item.author?.verified_speaker),
      verifiedOfficial: Boolean(item.author?.verified_official),
    },
    timeAgo: relativeFa(item.published_at),
    body: stripHtml(item.body || ""),
    attachments: (item.attachments || []).map((attachment) => ({
      id: String(attachment.id),
      label: attachment.label || attachment.filename || "پیوست",
      detail: attachment.type || "فایل",
      icon: attachmentIcon(attachment.type),
      previewSrc: attachment.type === "image" || attachment.type === "video" ? attachment.url : undefined,
      posterSrc: attachment.type === "video" ? attachment.poster_url || attachment.thumbnail_url || undefined : undefined,
      audioSrc: attachment.type === "audio" ? attachment.url : undefined,
      previewAlt: attachment.label || name,
      width: attachment.width,
      height: attachment.height,
    })),
  };
}
