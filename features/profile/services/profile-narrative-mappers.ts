import { plainText } from "@/lib/meydan-api";
import type { FeedAttachment, FeedPost } from "@/features/feed/types";
import type { ProfileDetails, ProfileNarrative, ProfileReply } from "../types";
import type { ApiComment, ApiNarrative } from "./profile-api-types";

export function timeFa(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function relativeFa(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60000),
  );

  const number = new Intl.NumberFormat("fa-IR");

  if (diffMinutes < 60) {
    return `${number.format(diffMinutes)} دقیقه پیش`;
  }

  const hours = Math.round(diffMinutes / 60);

  if (hours < 24) {
    return `${number.format(hours)} ساعت پیش`;
  }

  return `${number.format(Math.round(hours / 24))} روز پیش`;
}

export function emptyActivity(): ProfileDetails["activity"] {
  return {
    id: "none",
    authorLabel: "ثبت‌شده توسط مسئول موکب",
    timeLabel: "",
    content: "هنوز روایتی برای این میدان ثبت نشده است.",
    tags: [],
    likes: 0,
    reposts: 0,
    comments: 0,
  };
}

export function mapNarrative(activity: ApiNarrative): ProfileNarrative {
  return {
    id: String(activity.id),

    authorLabel: "ثبت‌شده توسط مسئول میدان",

    timeLabel: relativeFa(activity.published_at),

    content: plainText(activity.body || ""),

    tags: activity.tags || [],

    likes: activity.stats?.likes || 0,

    reposts: activity.stats?.reposts || 0,

    comments: activity.stats?.comments || 0,
  };
}

export function mapReply(item: ApiComment): ProfileReply {
  return {
    id: String(item.id),

    narrativeId: String(item.narrative_id),

    content: plainText(item.body || ""),

    timeLabel: relativeFa(item.created_at),
  };
}

function attachmentIcon(type?: string): FeedAttachment["icon"] {
  if (type === "image") {
    return "image";
  }

  if (type === "video") {
    return "video";
  }

  if (type === "audio") {
    return "microphone";
  }

  return "article";
}

function mediaReflectionOutlets(
  reflections: NonNullable<ApiNarrative["media_reflections"]>,
): string[] {
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

export function mapNarrativePost(
  item: ApiNarrative,
  identity: ProfileDetails["identity"],
): FeedPost {
  const id = item.author?.id || "";

  const actorId = Number(id.match(/(?:sq_|u_)?(\d+)$/)?.[1] || 0);

  const attachments = (item.attachments || []).map((attachment) => ({
    id: String(attachment.id),

    label: attachment.label || attachment.filename || "پیوست",

    detail: attachment.type || "فایل",

    icon: attachmentIcon(attachment.type),

    previewSrc:
      attachment.type === "image" || attachment.type === "video"
        ? attachment.url
        : undefined,

    posterSrc:
      attachment.type === "video"
        ? attachment.poster_url || attachment.thumbnail_url || undefined
        : undefined,

    audioSrc: attachment.type === "audio" ? attachment.url : undefined,

    previewAlt: attachment.label || identity.name,

    width: attachment.width,

    height: attachment.height,
  }));

  const reflections = item.media_reflections || [];

  const reflection = reflections[0];

  const reflectionOutlets = mediaReflectionOutlets(reflections);

  const reflectionSummary = mediaReflectionSummary(reflectionOutlets);

  return {
    id: String(item.id),

    author: {
      id: actorId,

      type: item.author?.type || "square",

      avatarUrl: item.author?.avatar_url || identity.avatar,

      verified: Boolean(item.author?.verified ?? identity.verified),
      verifiedSpeaker: Boolean(identity.verifiedSpeaker),
      verifiedOfficial: Boolean(identity.verifiedOfficial),
    },

    initiativeId: item.initiative?.id,

    viewerState: {
      liked: Boolean(item.viewer_state?.liked),

      reposted: Boolean(item.viewer_state?.reposted),

      joined: Boolean(item.initiative?.viewer_state?.joined),

      canDelete: Boolean(item.viewer_state?.can_delete),
    },

    kind:
      attachments.some(
        (attachment) =>
          attachment.icon === "image" || attachment.icon === "video",
      ) || reflection
        ? "media"
        : "ideas",

    squareName: item.author?.display_name || identity.name,

    handle: identity.handle,

    timeAgo: relativeFa(item.published_at),

    city: identity.location,

    badge: item.tags?.[0] || "روایت میدان",

    title: item.author?.display_name || identity.name,

    body: plainText(item.body || ""),

    attachments,

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

      views: item.stats?.views || 0,
    },

    callToAction: item.initiative?.cta_label || undefined,
  };
}
