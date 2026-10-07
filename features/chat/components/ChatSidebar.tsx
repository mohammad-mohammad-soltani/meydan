"use client";

import { useUnreadCounts } from "../providers/UnreadProvider";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
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

/** Share of the pane width a lazy release must cross to commit, and the flick speed (px/ms) that commits anyway. */
const COMMIT_RATIO = 0.3;
const COMMIT_VELOCITY = 0.45;
/** Pull felt when dragging toward a pane that does not exist. */
const OVERSCROLL = 0.18;
const SETTLE_MS = 360;

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

  const trackRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; t: number; lastX: number; lastT: number; v: number; axis: "?" | "x" | "y"; width: number; skip: boolean } | null>(null);
  // True from the first dragged pixel until the pane has settled; both panes stay laid out meanwhile.
  const [live, setLive] = useState(false);
  const liveTimer = useRef<number | null>(null);
  const firstRender = useRef(true);
  const [liveHeight, setLiveHeight] = useState(0);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setLive(true);
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setLive(false), SETTLE_MS);
    return () => {
      if (liveTimer.current) window.clearTimeout(liveTimer.current);
    };
  }, [chat.section]);

  // Panes sit side by side (notifications left, conversations right); the active one is the only one in flow.
  const measureActive = () => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>(".ch-pane.on");
    setLiveHeight(active?.offsetHeight ?? 0);
  };
  const onTouchStart = (event: TouchEvent) => {
    const { clientX: x, clientY: y } = event.touches[0];
    const box = trackRef.current?.parentElement;
    gesture.current = {
      x, y, t: Date.now(), lastX: x, lastT: Date.now(), v: 0, axis: "?",
      width: box?.clientWidth ?? 1,
      skip: !!(event.target as HTMLElement).closest("input,textarea"),
    };
  };
  const onTouchMove = (event: TouchEvent) => {
    const g = gesture.current;
    const track = trackRef.current;
    if (!g || g.skip || !track || g.axis === "y") return;
    const { clientX, clientY } = event.touches[0];
    const dx = clientX - g.x;
    const dy = clientY - g.y;
    if (g.axis === "?") {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) {
        g.axis = "y";
        return;
      }
      g.axis = "x";
      measureActive();
      setLive(true);
      track.style.transition = "none";
    }
    const now = Date.now();
    if (now - g.lastT >= 8) {
      g.v = (clientX - g.lastX) / (now - g.lastT);
      g.lastX = clientX;
      g.lastT = now;
    }
    // Content follows the finger 1:1 inside the valid range (conversations: 0…+W, notifications: −W…0).
    const inRange = chat.section === "conversations" ? Math.min(Math.max(dx, 0), g.width) : Math.max(Math.min(dx, 0), -g.width);
    const over = dx - (chat.section === "conversations" ? Math.max(dx, 0) : Math.min(dx, 0));
    const offset = inRange + over * OVERSCROLL;
    const base = chat.section === "conversations" ? -g.width : 0;
    track.style.transform = `translate3d(${base + offset}px,0,0)`;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const g = gesture.current;
    gesture.current = null;
    const track = trackRef.current;
    if (!g || g.skip || g.axis !== "x" || !track) return;
    const dx = event.changedTouches[0].clientX - g.x;
    const toward = chat.section === "conversations" ? dx > 0 : dx < 0;
    const flick = chat.section === "conversations" ? g.v > COMMIT_VELOCITY : g.v < -COMMIT_VELOCITY;
    const commit = toward && (Math.abs(dx) > g.width * COMMIT_RATIO || flick);
    // Hand the transform back to the stylesheet so the pane settles with its own easing.
    track.style.transition = "";
    track.style.transform = "";
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setLive(false), SETTLE_MS);
    if (commit) chat.setSection(chat.section === "conversations" ? "notifications" : "conversations");
  };
  const onTouchCancel = () => {
    const track = trackRef.current;
    gesture.current = null;
    if (track) {
      track.style.transition = "";
      track.style.transform = "";
    }
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setLive(false), SETTLE_MS);
  };

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

      <div
        className="ch-vp"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <div ref={trackRef} className={`ch-track ${notifications ? "n" : ""}`}>
          <div
            className={`ch-pane ${notifications ? "on" : ""}`}
            aria-hidden={!notifications}
            inert={!notifications}
            style={!notifications ? (live ? { maxHeight: liveHeight || undefined, overflow: "hidden" } : { maxHeight: 0, overflow: "hidden", visibility: "hidden" }) : undefined}
          >
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
          </div>
          <div
            className={`ch-pane ${notifications ? "" : "on"}`}
            aria-hidden={notifications}
            inert={notifications}
            style={notifications ? (live ? { maxHeight: liveHeight || undefined, overflow: "hidden" } : { maxHeight: 0, overflow: "hidden", visibility: "hidden" }) : undefined}
          >
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
          </div>
        </div>
      </div>
    </aside>
  );
}
