"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isRealtimeConnected, subscribeToRealtimeConnection } from "@/lib/realtime/client";
import { getRealtimeUserId } from "@/lib/realtime/config";
import { subscribeToUserChannel } from "@/lib/realtime/user-channel";
import { useUnreadCounts } from "../providers/UnreadProvider";
import {
  deleteMessage,
  editMessage,
  getConversationById,
  getConversations,
  getMessages,
  mapRealtimeMessage,
  markConversationRead,
  sendMessage,
  setConversationTyping,
  setMessageReaction,
  uploadChatAttachment,
} from "../services/chat.service";
import type { ChatAttachment, ChatMessage, Conversation, MessageReply } from "../types";

/** How long a keystroke keeps the typing indicator alive. */
const TYPING_IDLE_MS = 1200;

function asRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      const parsed: unknown = JSON.parse(payload);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof payload === "object" ? (payload as Record<string, unknown>) : null;
}

function recordString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return "";
}

function upsertMessage(list: ChatMessage[], incoming: ChatMessage) {
  const index = list.findIndex((message) => message.id === incoming.id || (incoming.clientId && message.clientId === incoming.clientId));
  if (index < 0) return [...list, incoming];
  const next = [...list];
  next[index] = { ...next[index], ...incoming, status: "sent" };
  return next;
}

export function useConversation(conversationId: string, initialConversation: Conversation | null = null, initialMessages: ChatMessage[] = []) {
  // Reading a conversation clears its unread messages, so the shared badge has
  // to re-read itself: the backend broadcasts `receipt:read` to the *other*
  // participants, and the reader updates its own counter after the REST write.
  const { refresh: refreshUnreadCounts } = useUnreadCounts();
  const lastMarkedReadRef = useRef("");
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialMessages);
  const [currentUserId, setCurrentUserId] = useState("");
  const [input, setInput] = useState("");
  // Loading/load-error are derived from which conversation the loaded data
  // belongs to, so switching conversations never needs a synchronous setState
  // inside an effect.
  const [loadState, setLoadState] = useState<{ conversationId: string; error: string | null }>(() => ({
    conversationId: initialConversation ? conversationId : "",
    error: null,
  }));
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(() => isRealtimeConnected());
  const [isPeerTyping, setIsPeerTyping] = useState(false);
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

  const isLoading = loadState.conversationId !== conversationId;
  const loadError = loadState.conversationId === conversationId ? loadState.error : null;
  const error = loadError || actionError;

  // Required data only: realtime config and the forward-target list must never
  // turn a healthy conversation request into "دریافت گفتگو انجام نشد".
  useEffect(() => {
    let active = true;
    void Promise.all([getConversationById(conversationId), getMessages(conversationId)])
      .then(([nextConversation, nextMessages]) => {
        if (!active) return;
        setConversation(nextConversation);
        setMessages(nextMessages);
        setActionError(null);
        setLoadState({ conversationId, error: nextConversation ? null : "این گفتگو پیدا نشد." });
      })
      .catch(() => {
        if (active) setLoadState({ conversationId, error: "دریافت گفتگو انجام نشد. دوباره تلاش کنید." });
      });
    return () => { active = false; };
  }, [conversationId]);

  // Viewer identity for private channels comes from `/chat/realtime/config`.
  useEffect(() => {
    let active = true;
    void getRealtimeUserId().then((userId) => {
      if (active && userId) setCurrentUserId(userId);
    });
    return () => { active = false; };
  }, [conversationId]);

  // Forward targets are a convenience list; a failure just hides the picker.
  useEffect(() => {
    let active = true;
    void getConversations()
      .then((items) => { if (active) setForwardTargets(items); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [conversationId]);

  const refreshMessages = useCallback(async () => {
    try {
      const fresh = await getMessages(conversationId);
      setMessages((current) => fresh.reduce(upsertMessage, current));
    } catch {
      // Live events keep the window usable until the next successful refresh.
    }
  }, [conversationId]);

  useEffect(
    () => subscribeToRealtimeConnection((state) => setIsConnected(state === "connected")),
    [],
  );

  // The identity lookup may have failed while the page loaded; once the shared
  // transport is up, retry it so the private channel can subscribe.
  useEffect(() => {
    if (currentUserId || !isConnected) return;
    let active = true;
    void getRealtimeUserId().then((userId) => {
      if (active && userId) setCurrentUserId(userId);
    });
    return () => { active = false; };
  }, [currentUserId, isConnected]);

  useEffect(() => {
    let active = true;
    let unbind: (() => void) | null = null;

    const onMessageCreated = (payload: unknown) => {
      const message = mapRealtimeMessage(payload);
      if (!message || message.conversationId !== conversationId) return;
      setMessages((current) => upsertMessage(current, message));
    };
    const onMessageUpdated = (payload: unknown) => {
      const message = mapRealtimeMessage(payload);
      if (!message || message.conversationId !== conversationId) return;
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    };
    const onMessageDeleted = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record || recordString(record, "conversationId", "conversation_id") !== conversationId) return;
      const messageId = recordString(record, "messageId", "message_id");
      setMessages((current) => current.filter((message) => message.id !== messageId));
    };
    const onMessageReaction = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      const eventConversationId = recordString(record, "conversationId", "conversation_id");
      if (eventConversationId && eventConversationId !== conversationId) return;
      const messageId = recordString(record, "messageId", "message_id");
      const reactions = Array.isArray(record.reactions) ? record.reactions.map(String) : [];
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactions } : message));
    };
    const onReceiptRead = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record || recordString(record, "conversationId", "conversation_id") !== conversationId) return;
      // The reader receives its own receipt echo; keep the local summary honest.
      if (recordString(record, "userId", "user_id") !== currentUserId) return;
      setConversation((current) => current ? { ...current, unreadCount: 0 } : current);
    };
    const onTypingChanged = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record || recordString(record, "conversationId", "conversation_id") !== conversationId) return;
      const userId = recordString(record, "userId", "user_id");
      if (!currentUserId || userId === currentUserId) return;
      setIsPeerTyping(Boolean(record.typing));
    };
    const onPresenceChanged = (payload: unknown) => {
      const record = asRecord(payload);
      if (!record) return;
      const userId = recordString(record, "userId", "user_id");
      const online = Boolean(record.online);
      setConversation((current) => current && current.participant.id === userId
        ? { ...current, participant: { ...current.participant, isOnline: online } }
        : current);
    };

    void subscribeToUserChannel(
      {
        "message:created": onMessageCreated,
        "message:updated": onMessageUpdated,
        "message:deleted": onMessageDeleted,
        "message:reaction": onMessageReaction,
        "receipt:read": onReceiptRead,
        "typing:changed": onTypingChanged,
        "presence:changed": onPresenceChanged,
      },
      {
        // Runs on the first subscribe and after every reconnect: re-read the
        // window so events missed while offline are reconciled.
        onSubscribed: () => { if (active) void refreshMessages(); },
      },
    )
      .then((off) => {
        if (active) unbind = off;
        else off();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      unbind?.();
    };
  }, [conversationId, currentUserId, refreshMessages]);

  useEffect(() => {
    if (!currentUserId || !messages.length) return;
    const lastIncoming = [...messages].reverse().find((message) => message.senderId !== currentUserId && message.status === "sent");
    if (!lastIncoming) return;
    // Skip the redundant write when the same message was already marked read.
    const readKey = `${conversationId}:${lastIncoming.id}`;
    if (lastMarkedReadRef.current === readKey) return;
    lastMarkedReadRef.current = readKey;
    void markConversationRead(conversationId, lastIncoming.id)
      .then(() => refreshUnreadCounts())
      .catch(() => undefined);
  }, [conversationId, currentUserId, messages, refreshUnreadCounts]);

  const sendTyping = useCallback((typing: boolean) => {
    void setConversationTyping(conversationId, typing).catch(() => undefined);
  }, [conversationId]);

  // Typing is a REST command now: `true` once when typing starts, `false` after
  // ~1.2s of inactivity (or immediately when the input is cleared). Never one
  // request per keystroke.
  useEffect(() => {
    if (!currentUserId || !conversation?.id) return;

    if (input.trim()) {
      if (!typingActive.current) {
        typingActive.current = true;
        sendTyping(true);
      }
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => {
        typingTimer.current = null;
        typingActive.current = false;
        sendTyping(false);
      }, TYPING_IDLE_MS);
      return;
    }

    if (!typingActive.current) return;
    typingActive.current = false;
    if (typingTimer.current) {
      window.clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    sendTyping(false);
  }, [conversation?.id, currentUserId, input, sendTyping]);

  // Leaving the conversation (or the page) must clear the peer's indicator.
  useEffect(() => () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (!typingActive.current) return;
    typingActive.current = false;
    void setConversationTyping(conversationId, false).catch(() => undefined);
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
        const canonical = await editMessage(original.id, body);
        setMessages((current) => current.map((message) => message.id === canonical.id ? { ...message, ...canonical } : message));
        setNotice("پیام ویرایش شد.");
      } catch {
        setMessages((current) => current.map((message) => message.id === original.id ? original : message));
        setActionError("ویرایش پیام انجام نشد.");
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
    setActionError(null);
    setIsSending(true);
    setMessages((current) => [...current, optimistic]);

    try {
      const persistedAttachment = pendingFile ? await uploadChatAttachment(pendingFile) : pendingAttachment;
      const sent = await sendMessage(conversationId, body, persistedAttachment, { clientId, replyToId: optimistic.replyTo?.id });
      // The backend also publishes `message:created` to the sender; upsert by id
      // and clientId keeps the optimistic record and the event from duplicating.
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
      setActionError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
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
    void deleteMessage(target.id)
      .then(() => setNotice("پیام حذف شد."))
      .catch(() => {
        setMessages((current) => current.some((message) => message.id === target.id) ? current : [...current, target].sort((a, b) => Number(a.id) - Number(b.id)));
        setActionError("حذف پیام انجام نشد.");
      });
  };

  const forwardTo = async (target: Conversation) => {
    if (!messageToForward) return;
    const message = messageToForward;
    try {
      await sendMessage(target.id, message.body, message.attachment, { clientId: crypto.randomUUID(), forwardedFromMessageId: message.id });
      setNotice(`پیام به «${target.participant.name}» فوروارد شد.`);
    } catch {
      setActionError("فوروارد پیام انجام نشد.");
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

function messageExcerpt(message: ChatMessage) {
  return message.body || message.attachment?.name || "فایل پیوست‌شده";
}
