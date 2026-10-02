"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { kindNames, messageTitle, type WorkMessage } from "../types";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { MessageMenu, type MenuPoint } from "./MessageMenu";
import { AnnouncementBubble, AnnouncementKeyboard } from "./bubbles/AnnouncementBubble";
import { MeetingBubble, MeetingKeyboard } from "./bubbles/MeetingBubble";
import { PollBubble } from "./bubbles/PollBubble";
import { Foot, Who } from "./bubbles/Shared";
import { TaskBubble, TaskKeyboard } from "./bubbles/TaskBubble";
import { TextBubble } from "./bubbles/TextBubble";
import { useRoom } from "./roomContext";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥"];

function PendingBubble({ m }: { m: WorkMessage }) {
  const kind = m.kind === "system" ? "text" : m.kind;
  return (
    <div className={`bub ${m.delivery === "failed" ? "failed" : ""}`}>
      {kind !== "text" ? <div className="rich-t">{m.pending_title || kindNames[kind]}</div> : null}
      {m.body ? <div className="txt">{m.body}</div> : null}
      <Foot m={m} mine={false} />
    </div>
  );
}

/**
 * One message: avatar + bubble + inline keyboard + hover actions (reply / react / edit / delete).
 * On touch widths a tap on the bubble opens the same actions as a bar below it.
 */
export function MessageRow({ m, cont, last }: { m: WorkMessage; cont: boolean; last: boolean }) {
  const { viewerId, manager, member, act, reply, guard } = useRoom();
  const mine = m.sender?.id === viewerId && !!viewerId;
  const [editing, setEditing] = useState(false);
  const [seenOpen, setSeenOpen] = useState(false);
  const [menu, setMenu] = useState<MenuPoint | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const swipeIcon = useRef<HTMLSpanElement>(null);
  const swipe = useRef<{ id: number; x: number; y: number; active: boolean; dx: number } | null>(null);
  const swiped = useRef(false);

  const rel = !!m.mentions.some((u) => u.id === viewerId) || !!m.task?.viewer_is_responsible;
  const deleted = !!m.deleted_at;
  const canEdit = !deleted && !m.delivery && (manager || mine);
  const canReply = !deleted && !m.delivery && m.can_reply && member;
  const canReact = !deleted && !m.delivery && member;

  const toggleReaction = (emoji: string, hasMine: boolean) => {
    if (!guard()) return;
    void act(`messages/${m.id}/reaction`, hasMine ? "DELETE" : "PUT", { reaction: emoji });
  };
  const save = async (patch: { title?: string; body: string }) => {
    const r = await act(`messages/${m.id}`, "PATCH", patch);
    if (r) setEditing(false);
  };
  const props = {
    m,
    mine,
    showWho: !cont,
    rel,
    editing,
    onSave: save,
    onCancel: () => setEditing(false),
    onReact: toggleReaction,
  };

  let bubble: ReactNode;
  let keyboard: ReactNode = null;
  if (m.delivery) bubble = <PendingBubble m={m} />;
  else if (deleted && m.kind !== "text")
    bubble = (
      <div className="bub deleted">
        {!mine && !cont ? <Who user={m.sender} role={m.sender_role} /> : null}
        <div className="txt">این {kindNames[m.kind as keyof typeof kindNames] ?? "پیام"} حذف شده است.</div>
        <Foot m={m} mine={false} />
      </div>
    );
  else if (m.kind === "task" && m.task) {
    bubble = <TaskBubble {...props} />;
    keyboard = <TaskKeyboard m={m} />;
  } else if (m.kind === "meeting" && m.meeting) {
    bubble = <MeetingBubble {...props} />;
    keyboard = <MeetingKeyboard m={m} />;
  } else if (m.kind === "announcement" && m.announcement) {
    bubble = <AnnouncementBubble {...props} seenOpen={seenOpen} />;
    keyboard = <AnnouncementKeyboard m={m} seenOpen={seenOpen} onToggleSeen={() => setSeenOpen((v) => !v)} />;
  } else if (m.kind === "poll" && m.poll) bubble = <PollBubble {...props} />;
  else bubble = <TextBubble {...props} />;

  // Telegram-style swipe: drag the bubble to the right, it springs back, then the composer takes focus for the reply.
  const SWIPE_MAX = 72;
  const SWIPE_TRIGGER = 56;
  const paint = (dx: number, animate: boolean) => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform .22s cubic-bezier(.2,.9,.3,1)" : "none";
    el.style.transform = dx ? `translateX(${dx}px)` : "";
    const ic = swipeIcon.current;
    if (ic) {
      const p = Math.min(1, dx / SWIPE_TRIGGER);
      ic.style.opacity = String(p);
      ic.style.transform = `translateY(-50%) scale(${0.6 + 0.4 * p})`;
      ic.dataset.ready = p >= 1 ? "1" : "";
    }
  };
  const swipeHandlers = canReply
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
          if (e.pointerType === "mouse" || !e.isPrimary) return;
          if ((e.target as HTMLElement).closest("button,a,input,textarea,label,select,video,audio,[role=slider]")) return;
          swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false, dx: 0 };
        },
        onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
          const st = swipe.current;
          if (!st || st.id !== e.pointerId) return;
          const dx = e.clientX - st.x;
          const dy = e.clientY - st.y;
          if (!st.active) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipe.current = null; return; }
            if (dx < 12 || dx < Math.abs(dy) * 1.2) return;
            st.active = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          // Rubber-band: resistance grows towards the cap.
          st.dx = SWIPE_MAX * (1 - Math.exp(-Math.max(0, dx - 12) / SWIPE_MAX));
          paint(st.dx, false);
          if (st.dx >= SWIPE_TRIGGER && navigator.vibrate && !e.currentTarget.dataset.buzzed) {
            e.currentTarget.dataset.buzzed = "1";
            navigator.vibrate(8);
          }
        },
        onPointerUp: finishSwipe,
        onPointerCancel: finishSwipe,
      }
    : {};
  function finishSwipe(e: ReactPointerEvent<HTMLDivElement>) {
    const st = swipe.current;
    swipe.current = null;
    delete e.currentTarget.dataset.buzzed;
    if (!st?.active) return;
    swiped.current = true;
    window.setTimeout(() => { swiped.current = false; }, 60);
    const fire = e.type === "pointerup" && st.dx >= SWIPE_TRIGGER;
    paint(0, true);
    if (fire) reply(m);
  }

  const canCopy = !deleted && !m.delivery && !!(m.body || messageTitle(m));
  const openMenuAt = (x: number, y: number) => {
    if (deleted || m.delivery) return;
    setMenu({ x, y });
  };
  const copyText = () => {
    closeMenu();
    const text = [messageTitle(m), m.body].filter((v, i, a) => v && a.indexOf(v) === i).join("\n");
    void navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  return (
    <div className={`row ${mine ? "mine" : "oth"} ${cont ? "grp-cont" : ""}`}>
      {mine ? null : last && m.sender ? <Avatar user={m.sender} className="side" /> : <span className="av side ghost" />}
      <div
        ref={wrapRef}
        className={`bwrap ${menu ? "menu-open" : ""}`}
        {...swipeHandlers}
        onClick={(e) => {
          if (swiped.current || m.delivery || deleted) return;
          // Touch widths have no right-click: a tap on the bubble opens the same context menu.
          if (!window.matchMedia("(max-width:820px)").matches) return;
          if ((e.target as HTMLElement).closest("button,a,input,textarea,label,select,video,audio")) return;
          openMenuAt(e.clientX, e.clientY);
        }}
        onContextMenu={(e) => {
          if (m.delivery || deleted) return;
          if ((e.target as HTMLElement).closest("a,input,textarea")) return;
          if (window.getSelection()?.toString()) return;
          e.preventDefault();
          openMenuAt(e.clientX, e.clientY);
        }}
      >
        {canReply ? <span ref={swipeIcon} className="swipe-ic" aria-hidden="true"><Icon name="reply" size={16} /></span> : null}
        {bubble}
        {keyboard}
        {canReply ? (
          <button type="button" className="b-reply" aria-label="پاسخ" title="پاسخ" onClick={() => { reply(m); }}>
            <Icon name="reply" size={15} />
          </button>
        ) : null}
        {!m.delivery && !deleted && (canReact || canEdit || canCopy) ? (
          <div className="b-acts">
            <button type="button" aria-label="گزینه‌ها" title="گزینه‌ها" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); openMenuAt(r.right, r.bottom + 4); }}>
              <Icon name="more" size={16} />
            </button>
          </div>
        ) : null}
      </div>
      {menu ? (
        <MessageMenu
          point={menu}
          reactions={canReact ? QUICK_REACTIONS.map((emoji) => ({ emoji, mine: !!m.reactions.find((r) => r.emoji === emoji)?.mine })) : null}
          canReply={!!canReply}
          canEdit={canEdit}
          canCopy={canCopy}
          onReact={(emoji, mineNow) => { closeMenu(); toggleReaction(emoji, mineNow); }}
          onReply={() => { closeMenu(); reply(m); }}
          onCopy={copyText}
          onEdit={() => { closeMenu(); setEditing(true); }}
          onDelete={() => { closeMenu(); void act(`messages/${m.id}`, "DELETE"); }}
          onClose={closeMenu}
        />
      ) : null}
    </div>
  );
}
