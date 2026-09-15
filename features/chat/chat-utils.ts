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
  icon_url?: string | null;
  created_at?: string | null;
  read_at?: string | null;
  deep_link?: string | null;
  entity_type?: string | null;
  entity_id?: string | number | null;
  payload?: { initiative_title?: string | null; aggregate_count?: number | null } | null;
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
  return `/users/${type}/${id}`;
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

  const rawType = String(item.type || "").toLowerCase();
  const entityId = item.entity_id === null || item.entity_id === undefined ? undefined : String(item.entity_id);

  return {
    id: String(item.id),
    kind: notificationKind(item.type),
    rawType,
    title: String(item.title || "اعلان جدید"),
    description: String(item.body || ""),
    createdAt: notificationTimeLabel(item.created_at),
    actor: mappedActor,
    iconUrl: item.icon_url || undefined,
    unread: !item.read_at,
    targetUrl: item.deep_link || undefined,
    entityType: item.entity_type || undefined,
    entityId,
  };
}

export function mergeNotification(current: ChatNotification[], incoming: ChatNotification): ChatNotification[] {
  return [incoming, ...current.filter((item) => item.id !== incoming.id)];
}

export function shouldRefreshNotificationFromApi(notification: Pick<ChatNotification, "actor">): boolean {
  return !notification.actor;
}

export function notificationVisualUrl(notification: Pick<ChatNotification, "actor" | "iconUrl">): string | undefined {
  return notification.actor?.avatarUrl || notification.iconUrl || undefined;
}

/** Actor-independent sentence for each backend notification type. `{actor}` is substituted. */
const NOTIFICATION_PHRASES: Record<string, string> = {
  like: "{actor} روایت شما را پسندید",
  repost: "{actor} روایت شما را بازنشر کرد",
  follow: "{actor} شما را دنبال کرد",
  comment: "{actor} روی روایت شما نظر گذاشت",
  comment_reply: "{actor} به نظر شما پاسخ داد",
  mention: "{actor} شما را در یک روایت نام برد",
  initiative_join: "{actor} به کار خوب شما ملحق شد",
  initiative_update: "کاری که در آن عضو هستید به‌روزرسانی شد",
  initiative_join_confirmed: "عضویت شما در کار خوب ثبت شد",
  media_reflection_added: "یک بازنشر رسانه‌ای برای روایت شما ثبت شد",
  square_verified: "میدان شما تأیید شد",
  square_rejected: "درخواست میدان شما رد شد",
  speaker_request_created: "درخواست سخنران شما ثبت شد",
  speaker_request_status_changed: "وضعیت درخواست سخنران شما تغییر کرد",
  speaker_invitation: "{actor} شما را برای سخنرانی دعوت کرده است",
  speaker_invitation_accepted: "{actor} دعوت سخنرانی شما را پذیرفت",
  speaker_invitation_rejected: "{actor} دعوت سخنرانی شما را نپذیرفت",
  content_published: "محتوای جدیدی منتشر شد",
};

/** Types that must never render as a human-actor sentence. */
const SYSTEM_NOTIFICATION_TYPES = new Set(["admin_notice", "system", "broadcast"]);

/** Deep links that carry no target identity; a typed route is preferred over these. */
const PLACEHOLDER_LINKS = new Set(["/profile", "/home"]);

/** Legacy boilerplate written before templates existed; never worth showing twice. */
const GENERIC_BODIES = new Set(["رویداد جدیدی در میدان ثبت شد.", "رویداد جدیدی در میدان ثبت شد"]);

export type NotificationPresentation = {
  title: string;
  description: string;
  avatarUrl?: string;
  visualUrl?: string;
  actorName?: string;
  href?: string;
  isSystem: boolean;
};

function truncate(value: string, max = 120): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * Single source of truth for how a notification reads and where it points.
 *
 * Text is generated from the backend `type` plus the real actor, so notifications
 * created before templates existed (which stored generic copy) render correctly
 * too. The stored `title`/`description` are only used as a last-resort fallback.
 */
export function getNotificationPresentation(notification: ChatNotification): NotificationPresentation {
  const actorName = notification.actor?.name?.trim();
  const phrase = NOTIFICATION_PHRASES[notification.rawType];
  // Per the product rule: anything without a human actor is a system notice.
  const isSystem = SYSTEM_NOTIFICATION_TYPES.has(notification.rawType) || !notification.actor;
  const preview = notification.targetPreview ? truncate(notification.targetPreview) : "";
  const storedTitle = String(notification.title || "").trim();

  let title = "";
  if (phrase?.includes("{actor}")) {
    // Actor-dependent sentence: only valid when we actually have the actor.
    if (actorName) title = phrase.replace("{actor}", actorName);
  } else if (phrase) {
    // Self-contained sentence («میدان شما تأیید شد») — no actor required.
    title = phrase;
  }
  if (!title && storedTitle && storedTitle !== "اعلان میدان") title = storedTitle;
  if (!title) title = actorName ? `${actorName} یک رویداد جدید در میدان ثبت کرد` : "اعلان میدان";

  // System notices keep their own body; social notifications show the target preview.
  const storedBody = String(notification.description || "").trim();
  const usableBody = GENERIC_BODIES.has(storedBody) ? "" : storedBody;
  const description = isSystem ? usableBody : preview || usableBody;

  return {
    title,
    description,
    avatarUrl: notification.actor?.avatarUrl || undefined,
    visualUrl: notificationVisualUrl(notification),
    actorName,
    href: notificationHref(notification),
    isSystem,
  };
}

/**
 * Resolves the destination for a notification.
 *
 * A stored `deep_link` wins unless it is a placeholder (`/profile`, `/home`) that
 * carries no target. Legacy `follow` rows stored `/profile`, so the actor profile
 * is derived instead. Note `initiative_join` cannot be derived client-side: its
 * `entity_id` is the initiative, and the viewable route needs the *narrative* that
 * embeds it — the backend resolves that into `deep_link`, so no guess is made here.
 */
export function notificationHref(notification: ChatNotification): string | undefined {
  const link = notification.targetUrl?.trim();
  if (link && !PLACEHOLDER_LINKS.has(link)) return link;

  const entityId = notification.entityId?.trim();
  const isActorTarget = notification.rawType === "follow" || notification.entityType === "actor";
  if (isActorTarget) {
    const actorId = notificationActorId(notification.actor);
    if (actorId) {
      const kind = notification.actor?.profileType === "square" ? "square" : "user";
      return `/users/${kind}/${actorId}`;
    }
  }
  if (notification.entityType === "narrative" && entityId) return `/posts/${entityId}`;
  // Square-scoped notices (verification, rejection) target the square itself.
  if (notification.entityType === "square" && entityId) return `/users/square/${entityId}`;
  return link || undefined;
}

/** `usr_9` / `sq_54` -> `9` / `54`. Returns "" when no trailing digits exist. */
export function notificationActorId(actor?: Pick<ChatUser, "profileId" | "id">): string {
  const raw = String(actor?.profileId || actor?.id || "");
  const digits = raw.match(/(\d+)$/)?.[1];
  return digits || "";
}

/** First line of a shared square location; the marker makes parsing unambiguous. */
const LOCATION_HEADER = "📍 موقعیت میدان";

export type SharedSquareLocation = {
  name: string;
  address?: string;
  /** External map link, when coordinates were available. */
  url?: string;
};

/**
 * Square locations travel as a plain, readable message so any client (and the
 * conversation list preview) shows something sensible, while this app upgrades
 * it into a real location card through `parseSquareLocationMessage`.
 */
export function formatSquareLocationMessage(location: {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}): string {
  const lines = [LOCATION_HEADER, location.name.trim() || "میدان"];
  if (location.address?.trim()) lines.push(location.address.trim());
  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    lines.push(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`);
  }
  return lines.join("\n");
}

/** Returns the location payload for a location message, otherwise null. */
export function parseSquareLocationMessage(body?: string): SharedSquareLocation | null {
  const text = (body || "").trim();
  if (!text.startsWith(LOCATION_HEADER)) return null;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const name = lines[1];
  if (!name) return null;

  return {
    name,
    address: lines.slice(2).find((line) => !/^https?:\/\//i.test(line)),
    url: lines.find((line) => /^https?:\/\//i.test(line)),
  };
}
