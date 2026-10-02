"use client";

import { Bell, CheckCheck, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Icon } from "@/features/works/components/Icon";
import { WorkRow, workActivity } from "@/features/works/components/WorkRow";
import { useWorksFeed } from "@/features/works/hooks/useWorksFeed";
import type { WorkGroup } from "@/features/works/types";
import type { useChat } from "../hooks/useChat";
import type { Conversation } from "../types";
import { DirectRow } from "./DirectRow";
import { NotificationsList } from "./NotificationsList";

type Entry =
  | { kind: "direct"; key: string; at: number; conversation: Conversation }
  | { kind: "work"; key: string; at: number; work: WorkGroup };

const time = (iso?: string | null) => {
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

export type Selected = { kind: "direct" | "work"; id: string } | null;

/** Right column of the chat page: direct conversations and work groups in one list (works get a richer row). */
export function ChatSidebar({ chat, selected }: { chat: ReturnType<typeof useChat>; selected: Selected }) {
  const [q, setQ] = useState("");
  const feed = useWorksFeed(q);

  const entries = useMemo(() => {
    const term = q.trim();
    const direct = (term
      ? chat.conversations.filter(({ participant, preview }) => `${participant.name} ${participant.handle} ${preview}`.includes(term))
      : chat.conversations
    ).map<Entry>((conversation) => ({ kind: "direct", key: `d${conversation.id}`, at: time(conversation.updatedAtIso), conversation }));
    const works = feed.works.map<Entry>((work) => ({ kind: "work", key: `w${work.id}`, at: time(workActivity(work)), work }));
    return [...direct, ...works].sort((a, b) => b.at - a.at);
  }, [chat.conversations, feed.works, q]);

  const notifications = chat.section === "notifications";
  const loading = chat.isLoading && feed.loading && !entries.length;

  return (
    <aside className="w-list">
      <div className="w-list-h">
        <div className="cs-switch" role="tablist" aria-label="گفتگوها و اعلان‌ها">
          <button type="button" role="tab" aria-selected={!notifications} aria-label="گفتگوها" className={!notifications ? "on" : ""} onClick={() => chat.setSection("conversations")}>
            <MessageCircle className="h-4 w-4" />
            گفتگوها
          </button>
          <button type="button" role="tab" aria-selected={notifications} aria-label="اعلان‌ها" className={notifications ? "on" : ""} onClick={() => chat.setSection("notifications")}>
            <Bell className="h-4 w-4" />
            اعلان‌ها
            {chat.unreadNotificationCount > 0 ? <span className="cs-dot" aria-hidden="true" /> : null}
          </button>
        </div>
      </div>

      {notifications ? (
        <>
          <div className="cs-notif-bar">
            <span>{chat.unreadNotificationCount > 0 ? `${chat.unreadNotificationCount.toLocaleString("fa-IR")} اعلان خوانده‌نشده` : "همه اعلان‌ها خوانده شده‌اند"}</span>
            {chat.unreadNotificationCount > 0 ? (
              <button type="button" onClick={() => void chat.readAllNotifications()}>
                <CheckCheck className="h-4 w-4" />
                خواندن همه
              </button>
            ) : null}
          </div>
          <div className="w-groups tw-scope" style={{ padding: 12 }}>
            {chat.isNotificationsLoading && !chat.notifications.length ? (
              <div className="w-empty">
                <span className="spin" aria-label="در حال دریافت" />
              </div>
            ) : (
              <NotificationsList notifications={chat.notifications} onRead={chat.readNotification} />
            )}
          </div>
        </>
      ) : (
        <>
          <label className="sp-search w-search">
            <Icon name="search" size={16} weight={2} />
            <input type="search" placeholder="جستجو در گفتگوها" aria-label="جستجو در گفتگوها" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="w-groups">
            {entries.map((e) =>
              e.kind === "work" ? (
                <WorkRow key={e.key} w={e.work} selected={selected?.kind === "work" && selected.id === e.work.id} />
              ) : (
                <DirectRow key={e.key} conversation={e.conversation} selected={selected?.kind === "direct" && selected.id === e.conversation.id} />
              ),
            )}
            {loading ? (
              <div className="w-empty">
                <span className="spin" aria-label="در حال دریافت" />
              </div>
            ) : null}
            {!loading && !entries.length && !feed.error ? <p className="hint" style={{ padding: 16 }}>گفتگویی پیدا نشد.</p> : null}
            {feed.error ? (
              <p className="hint err" role="alert" style={{ padding: 16 }}>
                {feed.error}{" "}
                <button type="button" className="edit-pp" onClick={() => void feed.reload()}>
                  تلاش دوباره
                </button>
              </p>
            ) : null}
            {feed.hasMore ? (
              <button type="button" className="btn load-more" disabled={feed.loadingMore} onClick={() => void feed.loadMore()}>
                کارهای بیشتر
              </button>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}
