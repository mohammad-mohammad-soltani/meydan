"use client";

import { Bell, CheckCheck, MessageCircle, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useChat } from "../hooks/useChat";
import { ConversationList } from "./ConversationList";
import { NotificationsList } from "./NotificationsList";
import type { ChatNotification, Conversation } from "../types";

export function ChatView({
  conversations,
  notifications,
}: {
  conversations: Conversation[];
  notifications: ChatNotification[];
}) {
  const chat = useChat(conversations, notifications);
  const [query, setQuery] = useState("");

  const visibleConversations = useMemo(() => {
    const term = query.trim();

    if (!term) return chat.conversations;

    return chat.conversations.filter(({ participant, preview }) =>
      `${participant.name} ${participant.handle} ${preview}`.includes(term)
    );
  }, [chat.conversations, query]);

  return (
    <section
      className="min-h-full bg-background pb-4 text-foreground"
      aria-label="پیام‌ها و اعلان‌ها"
    >
      <header className="sticky top-0 z-20 border-b border-border bg-surface-glass px-4 pt-4 backdrop-blur-md">

        {/* Tabs */}
        <div
          className="relative grid grid-cols-2 border-b border-border"
          role="tablist"
          aria-label="گفتگوها و اعلان‌ها"
        >
          <button
            type="button"
            role="tab"
            aria-selected={chat.section === "conversations"}
            onClick={() => chat.setSection("conversations")}
            className={`flex h-12 items-center justify-center gap-2 text-sm font-bold transition-colors ${
              chat.section === "conversations"
                ? "text-brand"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            گفتگوها
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={chat.section === "notifications"}
            onClick={() => chat.setSection("notifications")}
            className={`flex h-12 items-center justify-center gap-2 text-sm font-bold transition-colors ${
              chat.section === "notifications"
                ? "text-brand"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span className="relative">
              <Bell className="h-4 w-4" />

              {chat.unreadNotificationCount > 0 ? (
                <span className="absolute -right-3 -top-3 min-w-4 rounded-full bg-danger px-1 text-center text-[9px] leading-4 text-on-solid">
                  {chat.unreadNotificationCount > 99
                    ? "+۹۹"
                    : chat.unreadNotificationCount}
                </span>
              ) : null}
            </span>

            اعلان‌ها
          </button>

          {/* Single shared indicator, slides between the two tab columns */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 right-0 h-[3px] w-1/2 rounded-full bg-brand transition-transform duration-300 ease-out ${
              chat.section === "conversations"
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          />
        </div>


        {/* Search */}
        {chat.section === "conversations" ? (
          <div className="my-3 flex min-h-10 items-center gap-2 rounded-control border border-input-border bg-input px-3 text-icon-muted transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در گفتگوها"
              aria-label="جستجو در گفتگوها"
              className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="پاک کردن"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-hover"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-11 items-center justify-between border-t border-border/60 py-2">
            <span className="text-[11px] text-foreground-secondary">
              {chat.unreadNotificationCount > 0
                ? `${chat.unreadNotificationCount} اعلان خوانده‌نشده`
                : "همه اعلان‌ها خوانده شده‌اند"}
            </span>

            {chat.unreadNotificationCount > 0 ? (
              <button
                type="button"
                onClick={() => void chat.readAllNotifications()}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold text-brand transition-colors hover:bg-hover"
              >
                <CheckCheck className="h-4 w-4" />
                خواندن همه
              </button>
            ) : null}
          </div>
        )}
      </header>


      {/* Content — keyed by section so the enter animation replays on every switch */}
      <div key={chat.section} className="ui-enter">
        {chat.section === "conversations" ? (
          <ConversationList
            conversations={visibleConversations}
            isLoading={chat.isLoading}
          />
        ) : (
          <div className="px-4 py-3">
            {chat.isNotificationsLoading && !chat.notifications.length ? (
              <div
                className="space-y-2"
                aria-label="در حال دریافت اعلان‌ها"
              >
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-card border border-border bg-card"
                  />
                ))}
              </div>
            ) : (
              <NotificationsList
                notifications={chat.notifications}
                onRead={chat.readNotification}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}