export type MessageStatus = "sending" | "sent" | "failed";

export type ChatUser = {
  id: string;
  name: string;
  handle: string;
  avatarLabel: string;
  avatarTone: "red" | "amber";
  isVerified?: boolean;
  isOnline?: boolean;
};

export type Conversation = {
  id: string;
  participant: ChatUser;
  preview: string;
  updatedAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
  status: MessageStatus;
};

export type ChatNotificationKind = "like" | "repost" | "message" | "media" | "mention" | "follow";

export type ChatNotification = {
  id: string;
  kind: ChatNotificationKind;
  title: string;
  description: string;
  createdAt: string;
  conversationId?: string;
};
