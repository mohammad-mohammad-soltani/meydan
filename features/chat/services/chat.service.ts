import { meydanApi } from "@/lib/meydan-api";
import { chatUploadKey, emitChatUploadProgress } from "../chat-upload-progress";
import type { ChatAttachment, ChatMessage, Conversation } from "../types";
import type { ActorKind } from "@/lib/profile-route";

type ApiConversation = {
  id: string | number;
  type?: "direct" | "group";
  participant: {
    id: string | number;
    name: string;
    handle: string;
    avatar_url?: string | null;
    verified?: boolean;
    verified_official?: boolean;
    verified_speaker?: boolean;
    profile_type?: ActorKind;
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
    poster_url?: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    duration?: number;
  } | null;
  reply_to?: { id: string | number; body?: string; sender_name?: string } | null;
  forwarded_from?: string | null;
  reactions?: string[];
};

export type ChatUploadProgress = {
  progress: number;
  phase: "uploading" | "processing";
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
      isSpeaker: Boolean(item.participant.verified_speaker),
      isOfficial: Boolean(item.participant.verified_official),
      profileType: item.participant.profile_type || "user",
      profileId: item.participant.profile_id ? String(item.participant.profile_id) : id,
    },
    preview: item.preview || "گفتگوی جدید",
    updatedAt: timeLabel(item.updated_at),
    updatedAtIso: item.updated_at,
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
      posterSrc: item.attachment.poster_url || item.attachment.thumbnail_url || undefined,
      width: Number(item.attachment.width || 0) || undefined,
      height: Number(item.attachment.height || 0) || undefined,
      duration: Number(item.attachment.duration || 0) || undefined,
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

export type ShareableSquare = {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type ApiViewerMe = {
  account_type?: "user" | "square" | "media" | "collective" | "organization" | "speaker" | "official";
  square?: { id?: number; name?: string } | null;
};

type ApiSquareCard = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  } | null;
};

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function getShareableSquare(preferredSquareId?: number): Promise<ShareableSquare | null> {
  let squareId = preferredSquareId;
  let fallbackName = "";

  if (!squareId) {
    const me = await meydanApi<ApiViewerMe>("/me").catch(() => null);
    if (me?.account_type === "square" && me.square?.id) {
      squareId = me.square.id;
      fallbackName = me.square.name || "";
    }
  }

  if (!squareId) return null;

  const square = await meydanApi<ApiSquareCard>(`/squares/${squareId}`);
  const location = square.location || {};

  return {
    id: squareId,
    name: square.name || fallbackName || "میدان",
    address: location.address || undefined,
    latitude: finiteNumber(location.latitude ?? location.lat ?? square.latitude ?? square.lat),
    longitude: finiteNumber(location.longitude ?? location.lng ?? square.longitude ?? square.lng),
  };
}

function uploadChunk(
  uploadId: string,
  index: number,
  chunk: Blob,
  uploadedBefore: number,
  totalSize: number,
  onProgress?: (progress: ChatUploadProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/meydan/uploads/${encodeURIComponent(uploadId)}/chunks/${index}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("content-type", "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      const loaded = event.lengthComputable ? event.loaded : 0;
      const transferred = Math.min(totalSize, uploadedBefore + loaded);
      const percentage = totalSize > 0 ? (transferred / totalSize) * 100 : 0;
      onProgress?.({ phase: "uploading", progress: Math.min(100, Math.max(0, percentage)) });
    };

    xhr.onerror = () => reject(new Error("upload_network_error"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const transferred = Math.min(totalSize, uploadedBefore + chunk.size);
        const percentage = totalSize > 0 ? (transferred / totalSize) * 100 : 100;
        onProgress?.({ phase: "uploading", progress: Math.min(100, percentage) });
        resolve();
        return;
      }

      let message = `upload_chunk_${xhr.status}`;
      try {
        const payload = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        if (payload.error?.message) message = payload.error.message;
      } catch {
        // Keep the status-based fallback.
      }
      reject(new Error(message));
    };

    xhr.send(chunk);
  });
}

export async function uploadChatAttachment(
  file: File,
  onProgress?: (progress: ChatUploadProgress) => void,
): Promise<ChatAttachment> {
  const progressKey = chatUploadKey(file.name, file.size);
  const notify = (progress: ChatUploadProgress) => {
    onProgress?.(progress);
    emitChatUploadProgress({ key: progressKey, ...progress });
  };

  notify({ phase: "uploading", progress: 0 });

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
      const chunk = file.slice(offset, Math.min(file.size, offset + chunkSize));
      await uploadChunk(started.upload_id, index, chunk, offset, file.size, notify);
    }

    notify({ phase: "processing", progress: 100 });

    const completed = await meydanApi<{
      media_id: number;
      url: string;
      size: number;
      width?: number | null;
      height?: number | null;
      duration?: number | null;
      poster_url?: string | null;
      thumbnail_url?: string | null;
    }>(`/uploads/${started.upload_id}/complete`, { method: "POST" });

    return {
      id: String(completed.media_id),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: Number(completed.size || file.size),
      url: completed.url,
      previewUrl: completed.url,
      posterSrc: completed.poster_url || completed.thumbnail_url || undefined,
      width: Number(completed.width || 0) || undefined,
      height: Number(completed.height || 0) || undefined,
      duration: Number(completed.duration || 0) || undefined,
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
        width: attachment.width,
        height: attachment.height,
        duration: attachment.duration,
        poster_url: attachment.posterSrc,
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

export async function setConversationTyping(conversationId: string, typing: boolean): Promise<void> {
  await meydanApi(`/chat/conversations/${conversationId}/typing`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ typing }),
  });
}

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
