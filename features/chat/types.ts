export type MessageStatus = "sending" | "sent" | "failed";

export type ChatUser = {
  id: string;
  name: string;
  handle: string;
  avatarLabel: string;
  avatarTone: "red" | "amber" | "blue" | "emerald" | "violet" | "slate";
  avatarUrl?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  profileType?: "user" | "square";
  profileId?: string;
};

export type Conversation = {
  id: string;
  type?: "direct" | "group";
  participant: ChatUser;
  preview: string;
  updatedAt: string;
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
};

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
  url?: string;
};

export type MessageReply = { id: string; body: string; senderName: string };

export type SocketTicket = {
  ticket: string;
  userId: string;
  expiresAt: string;
  socketUrl: string;
};

export type ChatNotificationKind = "like" | "repost" | "media" | "mention" | "follow" | "comment" | "initiative" | "system";

export type ChatNotification = {
  id: string;
  kind: ChatNotificationKind;
  title: string;
  description: string;
  createdAt: string;
  conversationId?: string;
  actor?: ChatUser;
  unread?: boolean;
  targetUrl?: string;
};
