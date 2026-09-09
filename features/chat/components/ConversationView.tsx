"use client";

import { getCurrentUserId } from "../services/chat.service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConversation } from "../hooks/useConversation";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import type { ChatMessage, Conversation } from "../types";

export function ConversationView({ conversationId, conversation, messages }: { conversationId: string; conversation: Conversation | null; messages: ChatMessage[] }) {
  const chat = useConversation(conversationId, conversation, messages);
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

  const leaveConversation = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => router.push("/chat"), 220);
  };

  if (chat.isLoading) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">در حال باز کردن گفتگو...</section>;
  if (!chat.conversation) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">این گفتگو پیدا نشد.</section>;

  return <section className={"conversation-view chat-wallpaper flex h-full min-h-0 flex-1 flex-col overflow-hidden " + (isLeaving ? "conversation-view-leaving" : "conversation-view-entering")}><ChatHeader conversation={chat.conversation} isLeaving={isLeaving} onBack={leaveConversation} /><MessageList messages={chat.messages} currentUserId={getCurrentUserId()} />{chat.error ? <p className="bg-white/80 px-4 pb-2 text-[10px] text-red-500 dark:bg-[#0b141a]/80">{chat.error}</p> : null}<MessageInput value={chat.input} isSending={chat.isSending} notice={chat.attachmentNotice} onChange={chat.setInput} onSubmit={chat.send} onAttachmentRequested={chat.requestAttachment} /></section>;
}
