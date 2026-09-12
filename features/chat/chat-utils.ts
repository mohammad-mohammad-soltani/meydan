import type { ChatAttachment, ChatNotification, ChatNotificationKind, ChatUser } from "./types";

export type ChatAttachmentKind = "image" | "video" | "audio" | "file";

type SearchableMessage = {
  id: string;
  body?: string;
  attachment?: Partial<ChatAttachment>;
};

export type SharedMediaItem = {
  id: string;
  attachment: Partial<ChatAttachment>;
};

export type SharedLinkItem = {
  id: string;
  url: string;
};

export type ApiNotificationLike = {
  id: string | number;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
  read_at?: string | null;
  deep_link?: string | null;
  actor?: {
    id?: string | number | null;
    type?: "user" | "square" | string | null;
    numeric_id?: string | number | null;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
    verified?: boolean | null;
  } | null;
};

export function classifyChatAttachment(attachment: Pick<ChatAttachment, "mimeType"> | { mimeType?: string }): ChatAttachmentKind {
  const mime = String(attachment.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export function attachmentSource(attachment?: Partial<ChatAttachment>): string {
  return String(attachment?.url || attachment?.previewUrl || "");
}

export function filterChatMessages<T extends SearchableMessage>(messages: T[], query: string): T[] {
  const normalized = query.trim().toLocaleLowerCase("fa");
  if (!normalized) return messages;
  return messages.filter((message) => {
    const haystack = `${message.body || ""}\n${message.attachment?.name || ""}`.toLocaleLowerCase("fa");
    return haystack.includes(normalized);
  });
}

export function collectConversationSharedItems<T extends SearchableMessage>(messages: T[]) {
  const media: SharedMediaItem[] = [];
  const files: SharedMediaItem[] = [];
  const links: SharedLinkItem[] = [];
  const seenLinks = new Set<string>();

  for (const message of messages) {
    if (message.attachment) {
      const kind = classifyChatAttachment({ mimeType: message.attachment.mimeType });
      const item = { id: message.id, attachment: message.attachment };
      if (kind === "image" || kind === "video") media.push(item);
      else files.push(item);
    }

    const matches = String(message.body || "").match(/https?:\/\/[^\s<>"']+/gi) || [];
    for (const raw of matches) {
      const url = raw.replace(/[),.;!?،؛]+$/u, "");
      if (!url || seenLinks.has(url)) continue;
      seenLinks.add(url);
      links.push({ id: `${message.id}:${links.length}`, url });
    }
  }

  return { media, files, links };
}

export function participantProfileHref(participant: Pick<ChatUser, "id"> & Partial<Pick<ChatUser, "profileType" | "profileId">>): string {
  const type = participant.profileType === "square" ? "square" : "user";
  const id = participant.profileId || participant.id;
  return `/profile/${type}/${id}`;
}

export function chatContactHref(conversationId: string | number): string {
  return `/chat/${String(conversationId)}/info`;
}

export function notificationKind(type?: string | null): ChatNotificationKind {
  switch (String(type || "").toLowerCase()) {
    case "like":
      return "like";
    case "repost":
      return "repost";
    case "comment":
    case "comment_reply":
      return "comment";
    case "mention":
      return "mention";
    case "follow":
      return "follow";
    case "initiative_join":
    case "join_field":
      return "initiative";
    case "media":
    case "media_reflection":
      return "media";
    default:
      return "system";
  }
}

function notificationTimeLabel(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function mapApiNotification(item: ApiNotificationLike): ChatNotification {
  const actor = item.actor;
  const actorNumericId = String(actor?.numeric_id || actor?.id || "").replace(/^.*?_/, "");
  const actorName = String(actor?.display_name || "کاربر میدان");
  const mappedActor: ChatUser | undefined = actor ? {
    id: actorNumericId || String(actor.id || ""),
    name: actorName,
    handle: String(actor.handle || ""),
    avatarLabel: actorName.slice(0, 2),
    avatarTone: "slate",
    avatarUrl: actor.avatar_url || undefined,
    isVerified: Boolean(actor.verified),
    profileType: actor.type === "square" ? "square" : "user",
    profileId: actorNumericId || undefined,
  } : undefined;

  return {
    id: String(item.id),
    kind: notificationKind(item.type),
    title: String(item.title || "اعلان جدید"),
    description: String(item.body || ""),
    createdAt: notificationTimeLabel(item.created_at),
    actor: mappedActor,
    unread: !item.read_at,
    targetUrl: item.deep_link || undefined,
  };
}

export function mergeNotification(current: ChatNotification[], incoming: ChatNotification): ChatNotification[] {
  return [incoming, ...current.filter((item) => item.id !== incoming.id)];
}

export function shouldRefreshNotificationFromApi(notification: Pick<ChatNotification, "actor">): boolean {
  return !notification.actor;
}
