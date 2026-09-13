import { meydanApi } from "@/lib/meydan-api";
import type { ChatAttachment, ChatMessage, Conversation } from "../types";

type ApiConversation = {
  id: string | number;
  type?: "direct" | "group";
  participant: {
    id: string | number;
    name: string;
    handle: string;
    avatar_url?: string | null;
    verified?: boolean;
    profile_type?: "user" | "square";
    profile_id?: string | number;
  };
  preview?: string;
  updated_at?: string;
  unread_count?: number;
  last_message_id?: string | number | null;
  notifications_muted?: boolean;
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
  attachment?: {
    id?: string;
    name?: string;
    mime_type?: string;
    mimeType?: string;
    size?: number;
    url?: string;
    preview_url?: string;
    previewUrl?: string;
  } | null;
  reply_to?: { id: string | number; body?: string; sender_name?: string } | null;
  forwarded_from?: string | null;
  reactions?: string[];
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
      profileType: item.participant.profile_type || "user",
      profileId: item.participant.profile_id ? String(item.participant.profile_id) : id,
    },
    preview: item.preview || "گفتگوی جدید",
    updatedAt: timeLabel(item.updated_at),
    unreadCount: Number(item.unread_count || 0),
    lastMessageId: item.last_message_id ? String(item.last_message_id) : undefined,
    notificationsMuted: Boolean(item.notifications_muted),
  };
}

function mapMessage(item: ApiMessage): ChatMessage {
  const attachmentUrl = item.attachment?.url || item.attachment?.preview_url || item.attachment?.previewUrl;
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
      mimeType: item.attachment.mime_type || item.attachment.mimeType || "application/octet-stream",
      size: Number(item.attachment.size || 0),
      url: attachmentUrl || undefined,
      previewUrl: attachmentUrl || undefined,
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

export async function getMessages(conversationId: string, beforeId?: string, limit = 50): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ limit: String(Math.min(100, Math.max(1, limit))) });
  if (beforeId) params.set("before_id", beforeId);
  const result = await meydanApi<ApiMessage[]>(`/chat/conversations/${conversationId}/messages?${params}`);
  return result.map(mapMessage);
}

export async function getConversationHistory(conversationId: string, maxMessages = 300): Promise<ChatMessage[]> {
  const history: ChatMessage[] = [];
  let beforeId: string | undefined;
  while (history.length < maxMessages) {
    const remaining = maxMessages - history.length;
    const page = await getMessages(conversationId, beforeId, Math.min(100, remaining));
    if (!page.length) break;
    history.unshift(...page);
    if (page.length < Math.min(100, remaining)) break;
    beforeId = page[0]?.id;
    if (!beforeId) break;
  }
  const unique = new Map(history.map((message) => [message.id, message]));
  return [...unique.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

export async function searchConversationMessages(conversationId: string, query: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ q: query, limit: "100" });
  const result = await meydanApi<ApiMessage[]>(`/chat/conversations/${conversationId}/search?${params}`);
  return result.map(mapMessage);
}

export async function setConversationMuted(conversationId: string, muted: boolean): Promise<Conversation> {
  const result = await meydanApi<ApiConversation>(`/chat/conversations/${conversationId}/mute`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ muted }),
  });
  return mapConversation(result);
}

export async function uploadChatAttachment(file: File): Promise<ChatAttachment> {
  const started = await meydanApi<{ upload_id: string; chunk_size: number }>("/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      purpose: "chat",
    }),
  });

  const chunkSize = Math.max(1, Number(started.chunk_size || 5 * 1024 * 1024));
  try {
    for (let offset = 0, index = 0; offset < file.size; offset += chunkSize, index += 1) {
      await meydanApi(`/uploads/${started.upload_id}/chunks/${index}`, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: file.slice(offset, Math.min(file.size, offset + chunkSize)),
      });
    }
    const completed = await meydanApi<{ media_id: number; url: string; size: number }>(`/uploads/${started.upload_id}/complete`, { method: "POST" });
    return {
      id: String(completed.media_id),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: Number(completed.size || file.size),
      url: completed.url,
      previewUrl: completed.url,
    };
  } catch (error) {
    await meydanApi(`/uploads/${started.upload_id}`, { method: "DELETE" }).catch(() => undefined);
    throw error;
  }
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

/**
 * Publishes the typing indicator for a conversation.
 *
 * Typing is a REST command: the backend relays it to the other participants as
 * `typing:changed` over Soketi. There is no client-side socket emit any more.
 */
export async function setConversationTyping(conversationId: string, typing: boolean): Promise<void> {
  await meydanApi(`/chat/conversations/${conversationId}/typing`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ typing }),
  });
}

/**
 * Maps a realtime event payload.
 *
 * The backend publishes the same wire shape the REST endpoints return
 * (`conversation_id`, `sender_id`, `client_id`, …), so realtime and REST
 * messages are normalized through the exact same mapper.
 */
export function mapRealtimeMessage(payload: unknown): ChatMessage | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Partial<ApiMessage>;
  if (candidate.id === undefined || candidate.id === null) return null;

  try {
    return mapMessage(candidate as ApiMessage);
  } catch {
    return null;
  }
}
