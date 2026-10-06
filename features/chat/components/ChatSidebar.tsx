"use client";

import { useUnreadCounts } from "../providers/UnreadProvider";
import { useMemo, useState } from "react";
import { WorkRow, workActivity } from "@/features/works/components/WorkRow";
import { useWorksFeed } from "@/features/works/hooks/useWorksFeed";
import type { WorkGroup } from "@/features/works/types";
import type { useChat } from "../hooks/useChat";
import type { Conversation } from "../types";
import { ChIcon } from "./ChIcon";
import { DirectRow } from "./DirectRow";
import { NotificationsList } from "./NotificationsList";

type Entry =
  | { kind: "direct"; key: string; at: number; conversation: Conversation }
  | { kind: "work"; key: string; at: number; work: WorkGroup };

const time = (iso?: string | null) => {
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};
const count = (n: number) => (n > 99 ? "۹۹+" : n.toLocaleString("fa-IR"));

export type Selected = { kind: "direct" | "work"; id: string } | null;

/** Right column of the chat page (reference `.ch-l`): direct conversations and work groups in one list. */
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

  const unread = useUnreadCounts();
  const notifications = chat.section === "notifications";
  const loading = chat.isLoading && feed.loading && !entries.length;

  return (
    <aside className="w-list ch-l">
      <div className={`ch-seg ${notifications ? "n" : ""}`} role="tablist" aria-label="گفتگوها و اعلان‌ها">
        <i />
        <button type="button" role="tab" aria-selected={!notifications} aria-label="گفتگوها" className={!notifications ? "on" : ""} onClick={() => chat.setSection("conversations")}>
          <ChIcon name="chat" size={18} />
          <span>گفتگوها</span>
          {unread.messages > 0 ? <em>{count(unread.messages)}</em> : null}
        </button>
        <button type="button" role="tab" aria-selected={notifications} aria-label="اعلان‌ها" className={notifications ? "on" : ""} onClick={() => chat.setSection("notifications")}>
          <ChIcon name="bell" size={18} />
          <span>اعلان‌ها</span>
          {chat.unreadNotificationCount > 0 ? <em>{count(chat.unreadNotificationCount)}</em> : null}
        </button>
      </div>

      {notifications ? (
        <>
          <div className="ch-sb">
            <div className="ch-nh">
              <b>اعلان‌های اخیر</b>
              <button type="button" disabled={chat.unreadNotificationCount === 0} onClick={() => void chat.readAllNotifications()}>
                <ChIcon name="task" size={16} /> همه را خوانده کن
              </button>
            </div>
          </div>
          <div className="ch-list">
            {chat.isNotificationsLoading && !chat.notifications.length ? (
              <div className="ch-em2">
                <span className="spin" aria-label="در حال دریافت" />
              </div>
            ) : (
              <NotificationsList notifications={chat.notifications} onRead={chat.readNotification} />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="ch-sb">
            <label className="ch-sr">
              <ChIcon name="sr" size={18} />
              <input type="search" placeholder="جستجو در گفتگوها" aria-label="جستجو در گفتگوها" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
          <div className="ch-list">
            {entries.map((e) =>
              e.kind === "work" ? (
                <WorkRow key={e.key} w={e.work} selected={selected?.kind === "work" && selected.id === e.work.id} />
              ) : (
                <DirectRow key={e.key} conversation={e.conversation} selected={selected?.kind === "direct" && selected.id === e.conversation.id} />
              ),
            )}
            {loading ? (
              <div className="ch-em2">
                <span className="spin" aria-label="در حال دریافت" />
              </div>
            ) : null}
            {!loading && !entries.length && !feed.error ? (
              <div className="ch-em2">
                <ChIcon name="sr" size={28} />
                <p>گفتگویی پیدا نشد</p>
              </div>
            ) : null}
            {feed.error ? (
              <p className="ch-nb" role="alert" style={{ padding: 16 }}>
                {feed.error}{" "}
                <button type="button" className="ch-bd" onClick={() => void feed.reload()}>
                  تلاش دوباره
                </button>
              </p>
            ) : null}
            {feed.hasMore ? (
              <button type="button" className="ch-more" disabled={feed.loadingMore} onClick={() => void feed.loadMore()}>
                کارهای بیشتر
              </button>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}
