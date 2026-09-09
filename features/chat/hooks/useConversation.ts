"use client";

import { useEffect, useState } from "react";
import { getConversations, getCurrentUserId, sendMessage } from "../services/chat.service";
import type { ChatAttachment, ChatMessage, Conversation, MessageReply } from "../types";

function now() { return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
function messageExcerpt(message: ChatMessage) { return message.body || message.attachment?.name || "فایل پیوست‌شده"; }

export function useConversation(conversationId: string, initialConversation: Conversation | null, initialMessages: ChatMessage[]) {
  const [conversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageReply | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [forwardTargets, setForwardTargets] = useState<Conversation[]>([]);

  useEffect(() => { void getConversations().then(setForwardTargets); }, []);

  const clearPendingAttachment = () => setAttachment((current) => {
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    return null;
  });

  const send = async () => {
    const body = input.trim();
    if (editingMessage) {
      if (!body) return;
      setMessages((current) => current.map((message) => message.id === editingMessage.id ? { ...message, body, editedAt: now() } : message));
      setEditingMessage(null);
      setInput("");
      setNotice("پیام ویرایش شد.");
      return;
    }
    if ((!body && !attachment) || isSending) return;
    const optimistic: ChatMessage = { id: "optimistic-" + crypto.randomUUID(), conversationId, senderId: getCurrentUserId(), body, sentAt: now(), status: "sending", attachment: attachment ?? undefined, replyTo: replyingTo ?? undefined };
    setInput(""); setAttachment(null); setReplyingTo(null); setError(null); setIsSending(true);
    setMessages((current) => [...current, optimistic]);
    try {
      const sent = await sendMessage(conversationId, body, attachment ?? undefined);
      setMessages((current) => current.map((message) => message.id === optimistic.id ? { ...sent, replyTo: optimistic.replyTo } : message));
    } catch {
      setMessages((current) => current.map((message) => message.id === optimistic.id ? { ...message, status: "failed" } : message));
      setError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
    } finally { setIsSending(false); }
  };

  const startReply = (message: ChatMessage) => {
    setEditingMessage(null);
    setReplyingTo({ id: message.id, body: messageExcerpt(message), senderName: message.senderId === getCurrentUserId() ? "شما" : conversation?.participant.name ?? "مخاطب" });
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("#directChatMessageInput")?.focus());
  };

  const startEdit = (message: ChatMessage) => {
    if (message.senderId !== getCurrentUserId()) return;
    setReplyingTo(null); clearPendingAttachment(); setEditingMessage(message); setInput(message.body);
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("#directChatMessageInput")?.focus());
  };

  const copyMessage = async (message: ChatMessage) => {
    try { await navigator.clipboard?.writeText(messageExcerpt(message)); setNotice("پیام کپی شد."); }
    catch { setNotice("امکان کپی پیام فراهم نشد."); }
  };

  const toggleReaction = (messageId: string, reaction: string) => setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactions: message.reactions?.includes(reaction) ? message.reactions.filter((item) => item !== reaction) : [...(message.reactions ?? []), reaction] } : message));

  const confirmDelete = () => {
    if (!messageToDelete) return;
    setMessages((current) => current.filter((message) => message.id !== messageToDelete.id));
    if (editingMessage?.id === messageToDelete.id) { setEditingMessage(null); setInput(""); }
    if (replyingTo?.id === messageToDelete.id) setReplyingTo(null);
    setMessageToDelete(null); setNotice("پیام حذف شد.");
  };

  const forwardTo = async (target: Conversation) => {
    if (!messageToForward) return;
    const message = messageToForward;
    if (target.id === conversationId) {
      setMessages((current) => [...current, { ...message, id: "forward-" + crypto.randomUUID(), senderId: getCurrentUserId(), sentAt: now(), status: "sent", forwardedFrom: message.senderId === getCurrentUserId() ? "شما" : conversation?.participant.name ?? "مخاطب" }]);
    } else await sendMessage(target.id, message.body, message.attachment);
    setMessageToForward(null); setNotice(`پیام به «${target.participant.name}» فوروارد شد.`);
  };

  return {
    conversation, messages, input, setInput, isLoading, isSending, error, notice, attachment, replyingTo, editingMessage, messageToDelete, messageToForward, forwardTargets,
    attachFile: (file: File) => setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { id: "attachment-" + crypto.randomUUID(), name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
    }),
    clearAttachment: clearPendingAttachment,
    cancelReply: () => setReplyingTo(null),
    cancelEdit: () => { setEditingMessage(null); setInput(""); },
    startReply, startEdit, copyMessage, toggleReaction,
    requestDelete: setMessageToDelete, cancelDelete: () => setMessageToDelete(null), confirmDelete,
    requestForward: setMessageToForward, cancelForward: () => setMessageToForward(null), forwardTo, send,
  };
}
