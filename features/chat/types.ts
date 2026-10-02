import type { ActorKind } from "@/lib/profile-route";
export type MessageStatus = "sending" | "sent" | "failed";

export type ChatUser = {
  id: string;
  name: string;
  handle: string;
  avatarLabel: string;
  avatarTone: "red" | "amber" | "blue" | "emerald" | "violet" | "slate";
  avatarUrl?: string;
  isVerified?: boolean;
  isSpeaker?: boolean;
  isOfficial?: boolean;
  isOnline?: boolean;
  profileType?: ActorKind;
  profileId?: string;
};

export type Conversation = {
  id: string;
  type?: "direct" | "group";
  participant: ChatUser;
  preview: string;
  updatedAt: string;
  /** Raw ISO timestamp of the last activity (used to merge with work groups). */
  updatedAtIso?: string;
  unreadCount: number;
  lastMessageId?: string;
  notificationsMuted?: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  clientId?: string;
  body: string;
  sentAt: string;
  status: MessageStatus;
  attachment?: ChatAttachment;
  replyTo?: MessageReply;
  forwardedFrom?: string;
  editedAt?: string;
  deletedAt?: string;
  reactions?: string[];
  /** Local-only transfer state for Telegram-style attachment progress. */
  uploadProgress?: number;
  uploadState?: "uploading" | "processing";
};

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
  url?: string;
  posterSrc?: string;
  width?: number;
  height?: number;
  duration?: number;
};

export type MessageReply = { id: string; body: string; senderName: string };

export type ChatNotificationKind = "like" | "repost" | "quote" | "media" | "mention" | "follow" | "comment" | "initiative" | "work" | "system";

export type ChatNotification = {
  id: string;
  kind: ChatNotificationKind;
  /** Raw backend `type` (e.g. `comment_reply`). Presentation text is derived from this. */
  rawType: string;
  /** Backend-authored text. Used only as a legacy fallback when no type mapping exists. */
  title: string;
  description: string;
  createdAt: string;
  conversationId?: string;
  actor?: ChatUser;
  /** Resolved backend notification image. Actor avatar wins there; template icon is its fallback. */
  iconUrl?: string;
  unread?: boolean;
  targetUrl?: string;
  /** Short preview of the target entity (narrative text, comment body) when available. */
  targetPreview?: string;
  /** Backend entity the notification is about; used to derive a link when `targetUrl` is a placeholder. */
  entityType?: string;
  entityId?: string;
};
