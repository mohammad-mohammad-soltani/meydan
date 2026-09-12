"use client";

import { useEffect, useRef, useState } from "react";
import { useUnreadCounts } from "../providers/UnreadProvider";
import { getChatSocket } from "../realtime/socket";
import {
  deleteMessage,
  editMessage,
  getConversationById,
  getConversations,
  getCurrentUserId,
  getMessages,
  mapMessage,
  markConversationRead,
  sendMessage,
  setConversationTyping,
  setMessageReaction,
  uploadChatAttachment,
} from "../services/chat.service";
import type { ChatAttachment, ChatMessage, Conversation, MessageReply } from "../types";

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function normalizeRealtimeMessage(message: ChatMessage): ChatMessage {
  return { ...message, id: String(message.id), conversationId: String(message.conversationId), senderId: String(message.senderId), sentAt: timeLabel(message.sentAt), status: "sent" };
}

function realtimeMessage(raw: unknown): ChatMessage {
  return normalizeRealtimeMessage(mapMessage(raw as never));
}

function messageExcerpt(message: ChatMessage) {
  return message.body || message.attachment?.name || "فایل پیوست‌شده";
}

function upsertMessage(list: ChatMessage[], incoming: ChatMessage) {
  const index = list.findIndex((message) => message.id === incoming.id || (incoming.clientId && message.clientId === incoming.clientId));
  if (index < 0) return [...list, incoming];
  const next = [...list];
  next[index] = { ...next[index], ...incoming, status: "sent" };
  return next;
}

export function useConversation(conversationId: string, initialConversation: Conversation | null = null, initialMessages: ChatMessage[] = []) {
  const { refresh: refreshUnreadCounts } = useUnreadCounts();
  const lastMarkedReadRef = useRef("");
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialMessages);
  const [currentUserId, setCurrentUserId] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(!initialConversation);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageReply | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [forwardTargets, setForwardTargets] = useState<Conversation[]>([]);
  const typingTimer = useRef<number | null>(null);
  const typingActive = useRef(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void Promise.all([getConversationById(conversationId), getMessages(conversationId), getCurrentUserId(), getConversations()])
      .then(([nextConversation, nextMessages, userId, targets]) => {
        if (!active) return;
        setConversation(nextConversation);
        setMessages(nextMessages);
        setCurrentUserId(userId);
        setForwardTargets(targets);
        setError(nextConversation ? null : "این گفتگو پیدا نشد.");
      })
      .catch(() => {
        if (active) setError("دریافت گفتگو انجام نشد. دوباره تلاش کنید.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [conversationId]);

  useEffect(() => {
    if (!conversation?.id || !currentUserId) return;
    let disposed = false;
    let socketRef: Awaited<ReturnType<typeof getChatSocket>> | null = null;

    const onCreated = (raw: unknown) => {
      const message = realtimeMessage(raw);
      if (message.conversationId !== conversationId) return;
      setMessages((current) => upsertMessage(current, message));
    };
    const onUpdated = (raw: unknown) => {
      const message = realtimeMessage(raw);
      if (message.conversationId !== conversationId) return;
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    };
    const onDeleted = ({ messageId, conversationId: eventConversationId }: { messageId: string; conversationId: string }) => {
      if (String(eventConversationId) !== conversationId) return;
      setMessages((current) => current.filter((message) => message.id !== String(messageId)));
    };
    const onReaction = ({ messageId, conversationId: eventConversationId, reactions }: { messageId: string; conversationId?: string; reactions: string[] }) => {
      if (eventConversationId && String(eventConversationId) !== conversationId) return;
      setMessages((current) => current.map((message) => message.id === String(messageId) ? { ...message, reactions } : message));
    };
    const onTyping = ({ conversationId: eventConversationId, userId, typing }: { conversationId: string; userId: string; typing: boolean }) => {
      if (String(eventConversationId) === conversationId && String(userId) !== currentUserId) setIsPeerTyping(Boolean(typing));
    };
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) => {
      setConversation((current) => current && current.participant.id === String(userId) ? { ...current, participant: { ...current.participant, isOnline: Boolean(online) } } : current);
    };
    const onConnect = () => {
      setIsConnected(true);
      void getMessages(conversationId).then((fresh) => !disposed && setMessages((current) => fresh.reduce(upsertMessage, current))).catch(() => undefined);
    };
    const onDisconnect = () => setIsConnected(false);

    void getChatSocket().then((socket) => {
      if (disposed) return;
      socketRef = socket;
      socket.on("message:created", onCreated);
      socket.on("message:updated", onUpdated);
      socket.on("message:deleted", onDeleted);
      socket.on("message:reaction", onReaction);
      socket.on("typing:changed", onTyping);
      socket.on("presence:changed", onPresence);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      setIsConnected(socket.connected);
    }).catch(() => setIsConnected(false));

    return () => {
      disposed = true;
      if (!socketRef) return;
      socketRef.off("message:created", onCreated);
      socketRef.off("message:updated", onUpdated);
      socketRef.off("message:deleted", onDeleted);
      socketRef.off("message:reaction", onReaction);
      socketRef.off("typing:changed", onTyping);
      socketRef.off("presence:changed", onPresence);
      socketRef.off("connect", onConnect);
      socketRef.off("disconnect", onDisconnect);
    };
  }, [conversation?.id, conversationId, currentUserId]);

  useEffect(() => {
    if (!currentUserId || !messages.length) return;
    const lastIncoming = [...messages].reverse().find((message) => message.senderId !== currentUserId && message.status === "sent");
    if (!lastIncoming) return;
    const readKey = `${conversationId}:${lastIncoming.id}`;
    if (lastMarkedReadRef.current === readKey) return;
    lastMarkedReadRef.current = readKey;
    void markConversationRead(conversationId, lastIncoming.id)
      .then(() => refreshUnreadCounts())
      .catch(() => undefined);
  }, [conversationId, currentUserId, messages, refreshUnreadCounts]);

  useEffect(() => {
    if (!currentUserId || !conversation?.id) return;
    if (typingTimer.current) window.clearTimeout(typingTimer.current);

    if (!input.trim()) {
      if (typingActive.current) {
        typingActive.current = false;
        void setConversationTyping(conversationId, false).catch(() => undefined);
      }
      return;
    }

    if (!typingActive.current) {
      typingActive.current = true;
      void setConversationTyping(conversationId, true).catch(() => undefined);
    }
    typingTimer.current = window.setTimeout(() => {
      typingActive.current = false;
      void setConversationTyping(conversationId, false).catch(() => undefined);
    }, 1200);

    return () => {
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
    };
  }, [conversation?.id, conversationId, currentUserId, input]);

  useEffect(() => () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (typingActive.current) void setConversationTyping(conversationId, false).catch(() => undefined);
  }, [conversationId]);

  const clearPendingAttachment = () => {
    setPendingAttachmentFile(null);
    setAttachment((current) => {
      if (current?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const send = async () => {
    const body = input.trim();
    if (editingMessage) {
      if (!body) return;
      const original = editingMessage;
      setMessages((current) => current.map((message) => message.id === original.id ? { ...message, body } : message));
      setEditingMessage(null);
      setInput("");
      try {
        const canonical = normalizeRealtimeMessage(await editMessage(original.id, body));
        setMessages((current) => current.map((message) => message.id === canonical.id ? { ...message, ...canonical } : message));
        setNotice("پیام ویرایش شد.");
      } catch {
        setMessages((current) => current.map((message) => message.id === original.id ? original : message));
        setError("ویرایش پیام انجام نشد.");
      }
      return;
    }

    if ((!body && !attachment) || isSending || !currentUserId) return;
    const clientId = crypto.randomUUID();
    const pendingAttachment = attachment ?? undefined;
    const pendingFile = pendingAttachmentFile;
    const optimistic: ChatMessage = {
      id: `optimistic-${clientId}`,
      clientId,
      conversationId,
      senderId: currentUserId,
      body,
      sentAt: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
      status: "sending",
      attachment: pendingAttachment,
      replyTo: replyingTo ?? undefined,
    };
    setInput("");
    setAttachment(null);
    setPendingAttachmentFile(null);
    setReplyingTo(null);
    setError(null);
    setIsSending(true);
    setMessages((current) => [...current, optimistic]);

    try {
      const persistedAttachment = pendingFile ? await uploadChatAttachment(pendingFile) : pendingAttachment;
      const sent = await sendMessage(conversationId, body, persistedAttachment, { clientId, replyToId: optimistic.replyTo?.id });
      setMessages((current) => upsertMessage(current, {
        ...sent,
        attachment: sent.attachment ? {
          ...sent.attachment,
          previewUrl: persistedAttachment?.previewUrl || pendingAttachment?.previewUrl || sent.attachment.previewUrl,
        } : undefined,
      }));
      if (pendingAttachment?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(pendingAttachment.previewUrl);
    } catch {
      setMessages((current) => current.map((message) => message.clientId === clientId ? { ...message, status: "failed" } : message));
      setError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSending(false);
    }
  };

  const startReply = (message: ChatMessage) => {
    setEditingMessage(null);
    setReplyingTo({ id: message.id, body: messageExcerpt(message), senderName: message.senderId === currentUserId ? "شما" : conversation?.participant.name ?? "مخاطب" });
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("#directChatMessageInput")?.focus());
  };

  const startEdit = (message: ChatMessage) => {
    if (message.senderId !== currentUserId) return;
    setReplyingTo(null);
    clearPendingAttachment();
    setEditingMessage(message);
    setInput(message.body);
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("#directChatMessageInput")?.focus());
  };

  const copyMessage = async (message: ChatMessage) => {
    try { await navigator.clipboard?.writeText(messageExcerpt(message)); setNotice("پیام کپی شد."); }
    catch { setNotice("امکان کپی پیام فراهم نشد."); }
  };

  const toggleReaction = (messageId: string, reaction: string) => {
    const target = messages.find((message) => message.id === messageId);
    const active = !target?.reactions?.includes(reaction);
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactions: active ? [...(message.reactions ?? []), reaction] : (message.reactions ?? []).filter((item) => item !== reaction) } : message));
    void setMessageReaction(messageId, reaction, active).catch(() => {
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactions: target?.reactions ?? [] } : message));
    });
  };

  const confirmDelete = () => {
    if (!messageToDelete) return;
    const target = messageToDelete;
    setMessageToDelete(null);
    setMessages((current) => current.filter((message) => message.id !== target.id));
    if (editingMessage?.id === target.id) { setEditingMessage(null); setInput(""); }
    if (replyingTo?.id === target.id) setReplyingTo(null);
    void deleteMessage(target.id).then(() => {
      setNotice("پیام حذف شد.");
    }).catch(() => {
      setMessages((current) => current.some((message) => message.id === target.id) ? current : [...current, target].sort((a, b) => Number(a.id) - Number(b.id)));
      setError("حذف پیام انجام نشد.");
    });
  };

  const forwardTo = async (target: Conversation) => {
    if (!messageToForward) return;
    const message = messageToForward;
    try {
      await sendMessage(target.id, message.body, message.attachment, { clientId: crypto.randomUUID(), forwardedFromMessageId: message.id });
      setNotice(`پیام به «${target.participant.name}» فوروارد شد.`);
    } catch {
      setError("فوروارد پیام انجام نشد.");
    } finally {
      setMessageToForward(null);
    }
  };

  return {
    conversation, messages, currentUserId, input, setInput, isLoading, isSending, isConnected, isPeerTyping, error, notice, attachment, replyingTo, editingMessage, messageToDelete, messageToForward, forwardTargets,
    attachFile: (file: File) => {
      setPendingAttachmentFile(file);
      setAttachment((current) => {
        if (current?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl);
        const previewable = /^(image|video|audio)\//.test(file.type);
        return { id: `attachment-${crypto.randomUUID()}`, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, previewUrl: previewable ? URL.createObjectURL(file) : undefined };
      });
    },
    clearAttachment: clearPendingAttachment,
    cancelReply: () => setReplyingTo(null),
    cancelEdit: () => { setEditingMessage(null); setInput(""); },
    startReply, startEdit, copyMessage, toggleReaction,
    requestDelete: setMessageToDelete, cancelDelete: () => setMessageToDelete(null), confirmDelete,
    requestForward: setMessageToForward, cancelForward: () => setMessageToForward(null), forwardTo, send,
  };
}
