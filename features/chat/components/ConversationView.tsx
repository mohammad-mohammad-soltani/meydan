"use client";

import { getCurrentUserId } from "../services/chat.service";
import { useConversation } from "../hooks/useConversation";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

export function ConversationView({ conversationId }: { conversationId: string }) {
  const chat = useConversation(conversationId);

  if (chat.isLoading) return <section className="flex min-h-[60vh] items-center justify-center text-xs text-slate-500">در حال باز کردن گفتگو...</section>;
  if (!chat.conversation) return <section className="flex min-h-[60vh] items-center justify-center text-xs text-slate-500">این گفتگو پیدا نشد.</section>;

  return <section className="flex min-h-[calc(100dvh-8rem)] flex-col bg-white dark:bg-[#070a0f]"><ChatHeader conversation={chat.conversation} /><MessageList messages={chat.messages} currentUserId={getCurrentUserId()} />{chat.error ? <p className="px-4 pb-2 text-[10px] text-red-500">{chat.error}</p> : null}<MessageInput value={chat.input} isSending={chat.isSending} notice={chat.attachmentNotice} onChange={chat.setInput} onSubmit={chat.send} onAttachmentRequested={chat.requestAttachment} /></section>;
}
