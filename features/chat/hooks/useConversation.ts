"use client";

import { useState } from "react";
import { getCurrentUserId, sendMessage } from "../services/chat.service";
import type { ChatMessage, Conversation } from "../types";

export function useConversation(conversationId: string, initialConversation: Conversation | null, initialMessages: ChatMessage[]) {
  const [conversation] = useState(initialConversation);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);

  const send = async () => {
    const body = input.trim();
    if (!body || isSending) return;

    const optimistic: ChatMessage = {
      id: "optimistic-" + crypto.randomUUID(),
      conversationId,
      senderId: getCurrentUserId(),
      body,
      sentAt: new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
      status: "sending",
    };

    setInput("");
    setError(null);
    setIsSending(true);
    setMessages((current) => [...current, optimistic]);

    try {
      const sent = await sendMessage(conversationId, body);
      setMessages((current) => current.map((message) => message.id === optimistic.id ? sent : message));
    } catch {
      setMessages((current) => current.map((message) => message.id === optimistic.id ? { ...message, status: "failed" } : message));
      setError("ارسال پیام انجام نشد. دوباره تلاش کنید.");
    } finally {
      setIsSending(false);
    }
  };

  return {
    conversation,
    messages,
    input,
    setInput,
    isLoading,
    isSending,
    error,
    attachmentNotice,
    requestAttachment: () => setAttachmentNotice("ارسال فایل در نسخهٔ متصل به سرویس گفتگو فعال می‌شود."),
    send,
  };
}
