"use client";

import { Bell, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useChat } from "../hooks/useChat";
import { ConversationList } from "./ConversationList";
import { NotificationsList } from "./NotificationsList";
import type { ChatNotification, Conversation } from "../types";

export function ChatView({ conversations, notifications }: { conversations: Conversation[]; notifications: ChatNotification[] }) {
  const chat = useChat(conversations, notifications);
  const [query, setQuery] = useState("");
  const visibleConversations = useMemo(() => {
    const term = query.trim();
    if (!term) return chat.conversations;
    return chat.conversations.filter(({ participant, preview }) => `${participant.name} ${participant.handle} ${preview}`.includes(term));
  }, [chat.conversations, query]);

  return (
    <section className="min-h-full bg-[#f6f7f8] pb-4 dark:bg-[#0f1115]" aria-label="گفتگوها">
      <header className="sticky top-0 z-20 border-b border-slate-200/85 bg-white/95 px-4 pb-3 pt-4 backdrop-blur-md dark:border-white/10 dark:bg-[#1f1f1f]/95">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-white">گفتگوها</h1>
          <button type="button" onClick={() => chat.setSection(chat.section === "notifications" ? "conversations" : "notifications")} aria-label="اعلان‌ها" className={"rounded-full p-2 transition " + (chat.section === "notifications" ? "bg-[#5c9edb] text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10")}><Bell className="h-5 w-5" /></button>
        </div>
        {chat.section === "conversations" ? <div className="chat-view-search mt-3 flex h-10 items-center gap-2 rounded-xl bg-[#eef1f4] px-3 text-slate-500 dark:bg-[#303030] dark:text-slate-400"><Search className="h-4 w-4 shrink-0" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو" aria-label="جستجو در گفتگوها" className="h-full w-full bg-transparent text-sm text-slate-900 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-500 dark:text-white" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="پاک‌کردن جستجو"><X className="h-4 w-4" /></button> : null}</div> : null}
      </header>
      {chat.section === "conversations" ? <ConversationList conversations={visibleConversations} isLoading={chat.isLoading} /> : <div className="px-4 py-3"><NotificationsList notifications={chat.notifications} /></div>}
    </section>
  );
}
