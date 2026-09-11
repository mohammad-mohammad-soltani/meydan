import { meydanApi } from "@/lib/meydan-api";
import type { ChatAttachment, ChatMessage, ChatNotification, Conversation, SocketTicket } from "../types";

type ApiConversation = {
  id: string | number;
  type?: "direct" | "group";
  participant: { id: string | number; name: string; handle: string; avatar_url?: string | null; verified?: boolean };
  preview?: string;
  updated_at?: string;
  unread_count?: number;
  last_message_id?: string | number | null;
};

type ApiMessage = {
  id: string | number;
  conversation_id: string | number;
  sender_id: string | number;
  client_id?: string;
  body?: string;
  created_at?: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  attachment?: { id?: string; name?: string; mime_type?: string; size?: number; url?: string } | null;
  reply_to?: { id: string | number; body?: string; sender_name?: string } | null;
  forwarded_from?: string | null;
  reactions?: string[];
};

type ApiMe = {
  account_type: "user" | "square";
  profile?: { id?: string | number } | null;
  square?: { owner_user_id?: string | number; id?: string | number } | null;
};

const avatarTones = ["red", "amber", "blue", "emerald", "violet", "slate"] as const;
function avatarTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return avatarTones[Math.abs(hash) % avatarTones.length];
}

function timeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function mapConversation(item: ApiConversation): Conversation {
  const id = String(item.participant.id);
  return {
    id: String(item.id),
    type: item.type,
    participant: {
      id,
      name: item.participant.name || "کاربر میدان",
      handle: item.participant.handle || `@user${id}`,
      avatarLabel: (item.participant.name || "ک").slice(0, 2),
      avatarTone: avatarTone(id),
      avatarUrl: item.participant.avatar_url || undefined,
      isVerified: Boolean(item.participant.verified),
    },
    preview: item.preview || "گفتگوی جدید",
    updatedAt: timeLabel(item.updated_at),
    unreadCount: Number(item.unread_count || 0),
    lastMessageId: item.last_message_id ? String(item.last_message_id) : undefined,
  };
}

function mapMessage(item: ApiMessage): ChatMessage {
  return {
    id: String(item.id),
    conversationId: String(item.conversation_id),
    senderId: String(item.sender_id),
    clientId: item.client_id,
    body: item.body || "",
    sentAt: timeLabel(item.created_at),
    status: "sent",
    attachment: item.attachment ? {
      id: item.attachment.id || `attachment-${item.id}`,
      name: item.attachment.name || "پیوست",
      mimeType: item.attachment.mime_type || "application/octet-stream",
      size: Number(item.attachment.size || 0),
      url: item.attachment.url || undefined,
      previewUrl: item.attachment.url || undefined,
    } : undefined,
    replyTo: item.reply_to ? {
      id: String(item.reply_to.id),
      body: item.reply_to.body || "",
      senderName: item.reply_to.sender_name || "کاربر",
    } : undefined,
    forwardedFrom: item.forwarded_from || undefined,
    editedAt: item.edited_at ? timeLabel(item.edited_at) : undefined,
    deletedAt: item.deleted_at || undefined,
    reactions: item.reactions || [],
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const result = await meydanApi<ApiConversation[]>("/chat/conversations");
  return result.map(mapConversation);
}

export async function createDirectConversation(participantUserId: string | number): Promise<Conversation> {
  const result = await meydanApi<ApiConversation>("/chat/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ participant_user_id: Number(participantUserId) }),
  });
  return mapConversation(result);
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const result = await meydanApi<ApiConversation>(`/chat/conversations/${conversationId}`);
    return mapConversation(result);
  } catch {
    return null;
  }
}

export async function getMessages(conversationId: string, beforeId?: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (beforeId) params.set("before_id", beforeId);
  const result = await meydanApi<ApiMessage[]>(`/chat/conversations/${conversationId}/messages?${params}`);
  return result.map(mapMessage);
}

export async function sendMessage(
  conversationId: string,
  body: string,
  attachment?: ChatAttachment,
  options?: { clientId?: string; replyToId?: string; forwardedFromMessageId?: string },
): Promise<ChatMessage> {
  const result = await meydanApi<ApiMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: options?.clientId || crypto.randomUUID(),
      body,
      reply_to_id: options?.replyToId,
      forwarded_from_message_id: options?.forwardedFromMessageId,
      attachment: attachment ? {
        id: attachment.id,
        name: attachment.name,
        mime_type: attachment.mimeType,
        size: attachment.size,
        url: attachment.url,
      } : undefined,
    }),
  });
  return mapMessage(result);
}

export async function editMessage(messageId: string, body: string): Promise<ChatMessage> {
  return mapMessage(await meydanApi<ApiMessage>(`/chat/messages/${messageId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  }));
}

export async function deleteMessage(messageId: string): Promise<void> {
  await meydanApi(`/chat/messages/${messageId}`, { method: "DELETE" });
}

export async function setMessageReaction(messageId: string, reaction: string, active: boolean): Promise<ChatMessage> {
  return mapMessage(await meydanApi<ApiMessage>(`/chat/messages/${messageId}/reaction`, {
    method: active ? "PUT" : "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reaction }),
  }));
}

export async function markConversationRead(conversationId: string, messageId: string): Promise<void> {
  await meydanApi(`/chat/conversations/${conversationId}/read`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message_id: messageId }),
  });
}

export async function getSocketTicket(): Promise<SocketTicket> {
  const result = await meydanApi<{ ticket: string; expires_at: string; socket_url: string }>("/chat/socket-ticket", { method: "POST" });
  return { ticket: result.ticket, expiresAt: result.expires_at, socketUrl: result.socket_url };
}

export async function getCurrentUserId(): Promise<string> {
  const me = await meydanApi<ApiMe>("/me");
  const id = me.profile?.id || me.square?.owner_user_id || me.square?.id;
  if (!id) throw new Error("Current chat user id is unavailable");
  return String(id);
}

export async function getNotifications(): Promise<ChatNotification[]> {
  try {
    const items = await meydanApi<Array<{ id: string | number; type?: string; title?: string; body?: string; created_at?: string; deep_link?: string }>>("/notifications?limit=50");
    return items.map((item) => ({
      id: String(item.id),
      kind: (["like", "repost", "message", "media", "mention", "follow"].includes(item.type || "") ? item.type : "message") as ChatNotification["kind"],
      title: item.title || "اعلان جدید",
      description: item.body || "",
      createdAt: timeLabel(item.created_at),
      conversationId: item.deep_link?.match(/\/chat\/(\d+)/)?.[1],
    }));
  } catch {
    return [];
  }
}

export { mapMessage };
