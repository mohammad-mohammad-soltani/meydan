"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { seenPage } from "../../services/works.service";
import type { WorkMessage, WorkUser } from "../../types";
import { fa, timeLabel } from "../../utils";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import { useRoom } from "../roomContext";
import { Attachment, Foot, Reactions, Who } from "./Shared";
import { TitleBody } from "./TitleBody";

type Seen = { user: WorkUser; seen_at: string };

export function AnnouncementKeyboard({ m, onToggleSeen, seenOpen }: { m: WorkMessage; onToggleSeen: () => void; seenOpen: boolean }) {
  const { manager, act, guard, viewerId } = useRoom();
  const a = m.announcement!;
  // The author does not acknowledge their own announcement.
  const isAuthor = !!viewerId && m.sender?.id === viewerId;
  const unseen = Math.max(0, a.member_total - a.seen_count);
  return (
    <div className="kb">
      {isAuthor ? null : a.seen_by_me ? (
        <button className="ok" disabled>
          ✓ دیدم
        </button>
      ) : (
        <button className="go" onClick={() => guard() && void act(`announcements/${m.id}/seen`, "PUT")}>
          دیدم
        </button>
      )}
      <button onClick={onToggleSeen} aria-expanded={seenOpen}>
        دیده‌ها · {fa(a.seen_count)}
      </button>
      {manager && unseen > 0 ? (
        <button onClick={() => void act(`announcements/${m.id}/remind`, "POST")}>
          <Icon name="bell" size={13} /> یادآوری به {fa(unseen)} نفر
        </button>
      ) : null}
    </div>
  );
}

/** Who pressed «دیدم» (paged). */
export function SeenList({ m }: { m: WorkMessage }) {
  const [items, setItems] = useState<Seen[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    seenPage(m.id)
      .then((p) => {
        if (!alive) return;
        setItems(p.data);
        setCursor(p.nextCursor);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "دریافت انجام نشد"));
    return () => {
      alive = false;
    };
  }, [m.id]);

  const more = async () => {
    if (!cursor) return;
    try {
      const p = await seenPage(m.id, cursor);
      setItems((v) => [...(v ?? []), ...p.data]);
      setCursor(p.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "دریافت انجام نشد");
    }
  };

  return (
    <div className="seen-list">
      {items?.map((s) => (
        <div className="seen-row" key={s.user.id}>
          <Avatar user={s.user} />
          <b>{s.user.name}</b>{s.user.work_label ? <span className="u-label">{s.user.work_label}</span> : null}
          <small>{timeLabel(s.seen_at)}</small>
        </div>
      ))}
      {items && !items.length ? <p className="hint">هنوز کسی ندیده است.</p> : null}
      {!items && !error ? <span className="spin" aria-label="در حال دریافت" /> : null}
      {error ? (
        <p className="hint err" role="alert">
          {error}
        </p>
      ) : null}
      {cursor ? (
        <button type="button" className="pk-more" onClick={() => void more()}>
          بیشتر
        </button>
      ) : null}
    </div>
  );
}

export function AnnouncementBubble({
  m,
  mine,
  showWho,
  rel,
  editing,
  seenOpen,
  onSave,
  onCancel,
  onReact,
  kb,
}: {
  m: WorkMessage;
  mine: boolean;
  showWho: boolean;
  rel: boolean;
  editing: boolean;
  seenOpen: boolean;
  onSave: (patch: { title?: string; body: string }) => Promise<void>;
  onCancel: () => void;
  onReact: (emoji: string, mine: boolean) => void;
  /** Inline keyboard (reference `.rk-st` / `.rk-r`): lives inside the card, above the time. */
  kb?: ReactNode;
}) {
  const { viewerId } = useRoom();
  const a = m.announcement!;
  return (
    <div className={`bub rich t-ann ${rel ? "rel" : ""}`} id={`work-message-${m.id}`}>
      <div className="rich-h">
        <Icon name="announcement" size={14} />
        {a.urgent ? "اعلان فوری و مهم" : "اعلان"}
        <span className="sp" />
        {m.pinned ? (
          <span className="stl">
            <Icon name="pinned" size={13} /> سنجاق
          </span>
        ) : null}
      </div>
      <div className="rich-b">
        {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
        <TitleBody m={m} viewerId={viewerId} editing={editing} onSave={onSave} onCancel={onCancel} />
        <Attachment m={m} />
        {kb}
        <Reactions m={m} onToggle={onReact} />
        <Foot
          m={m}
          mine={mine}
          extra={
            <span className="seen">
              · {fa(a.seen_count)} از {fa(a.member_total)} دیدند
            </span>
          }
        />
      </div>
      {seenOpen ? (
        <div className="details">
          <SeenList m={m} />
        </div>
      ) : null}
    </div>
  );
}
