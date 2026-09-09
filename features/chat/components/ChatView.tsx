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
    <section className="min-h-full bg-background pb-4 text-foreground" aria-label="گفتگوها">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-glass px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-extrabold tracking-tight text-foreground">گفتگوها</h1>
          <button type="button" onClick={() => chat.setSection(chat.section === "notifications" ? "conversations" : "notifications")} aria-label="اعلان‌ها" className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${chat.section === "notifications" ? "bg-info text-on-solid" : "text-icon hover:bg-hover"}`}><Bell className="h-5 w-5" /></button>
        </div>
        {chat.section === "conversations" ? (
          <div className="mt-3 flex min-h-10 items-center gap-2 rounded-control border border-input-border bg-input px-3 text-icon-muted transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو" aria-label="جستجو در گفتگوها" className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="پاک‌کردن جستجو" className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-hover"><X className="h-4 w-4" /></button> : null}
          </div>
        ) : null}
      </header>
      {chat.section === "conversations" ? <ConversationList conversations={visibleConversations} isLoading={chat.isLoading} /> : <div className="px-4 py-3"><NotificationsList notifications={chat.notifications} /></div>}
    </section>
  );
}
