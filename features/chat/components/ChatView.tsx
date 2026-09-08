"use client";

import { MessageSquare } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ConversationList } from "./ConversationList";
import { NotificationsList } from "./NotificationsList";
import type { ChatNotification, Conversation } from "../types";

export function ChatView({ conversations, notifications }: { conversations: Conversation[]; notifications: ChatNotification[] }) {
  const chat = useChat(conversations, notifications);

  return (
    <section className="space-y-4 p-4 pb-20" aria-label="گفتگوها">
      <div className="flex border-b border-slate-200 text-xs font-bold dark:border-slate-800">
        <button type="button" onClick={() => chat.setSection("conversations")} className={"flex-1 border-b-2 py-2.5 transition " + (chat.section === "conversations" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500 dark:text-slate-400")}>گفتگوها</button>
        <button type="button" onClick={() => chat.setSection("notifications")} className={"flex flex-1 items-center justify-center gap-1 border-b-2 py-2.5 transition " + (chat.section === "notifications" ? "border-brand-red text-brand-red" : "border-transparent text-slate-500 dark:text-slate-400")}><span>اعلان‌ها</span><MessageSquare className="h-3.5 w-3.5" /></button>
      </div>
      {chat.section === "conversations" ? <ConversationList conversations={chat.conversations} isLoading={chat.isLoading} /> : <NotificationsList notifications={chat.notifications} />}
    </section>
  );
}
