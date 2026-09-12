"use client";

import { Bell, Search, X, MessageCircle } from "lucide-react";
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
    <section className="min-h-full bg-background pb-4 text-foreground" aria-label="پیام‌ها و اعلان‌ها">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-glass px-4 pt-4 backdrop-blur-md">
        <div className="grid grid-cols-2 text-center">
          <button
            type="button"
            onClick={() => chat.setSection("conversations")}
            className={`relative flex h-12 items-center justify-center gap-2 text-sm font-bold transition-colors ${chat.section === "conversations" ? "text-primary" : "text-muted"}`}
          >
            <MessageCircle className="h-4 w-4" />
            گفتگوها
            {chat.section === "conversations" ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" /> : null}
          </button>
          <button
            type="button"
            onClick={() => chat.setSection("notifications")}
            className={`relative flex h-12 items-center justify-center gap-2 text-sm font-bold transition-colors ${chat.section === "notifications" ? "text-primary" : "text-muted"}`}
          >
            <Bell className="h-4 w-4" />
            اعلان‌ها
            {chat.section === "notifications" ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" /> : null}
          </button>
        </div>

        {chat.section === "conversations" ? (
          <div className="my-3 flex min-h-10 items-center gap-2 rounded-control border border-input-border bg-input px-3 text-icon-muted transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در گفتگوها" aria-label="جستجو در گفتگوها" className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="پاک کردن" className="grid h-8 w-8 place-items-center rounded-full hover:bg-hover"><X className="h-4 w-4" /></button> : null}
          </div>
        ) : null}
      </header>

      {chat.section === "conversations" ? (
        <ConversationList conversations={visibleConversations} isLoading={chat.isLoading} />
      ) : (
        <div className="px-4 py-3">
          <NotificationsList notifications={chat.notifications} />
        </div>
      )}
    </section>
  );
}
