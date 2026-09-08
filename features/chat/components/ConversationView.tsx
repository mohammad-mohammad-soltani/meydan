"use client";

import { getCurrentUserId } from "../services/chat.service";
import { useConversation } from "../hooks/useConversation";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import type { ChatMessage, Conversation } from "../types";

export function ConversationView({ conversationId, conversation, messages }: { conversationId: string; conversation: Conversation | null; messages: ChatMessage[] }) {
  const chat = useConversation(conversationId, conversation, messages);

  if (chat.isLoading) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">در حال باز کردن گفتگو...</section>;
  if (!chat.conversation) return <section className="flex min-h-0 flex-1 items-center justify-center text-xs text-slate-500">این گفتگو پیدا نشد.</section>;

  return <section className="flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-[#070a0f]"><ChatHeader conversation={chat.conversation} /><MessageList messages={chat.messages} currentUserId={getCurrentUserId()} />{chat.error ? <p className="px-4 pb-2 text-[10px] text-red-500">{chat.error}</p> : null}<MessageInput value={chat.input} isSending={chat.isSending} notice={chat.attachmentNotice} onChange={chat.setInput} onSubmit={chat.send} onAttachmentRequested={chat.requestAttachment} /></section>;
}
