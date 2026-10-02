"use client";

import { useRef, useState, type ReactNode } from "react";
import { kindNames, type WorkMessage } from "../types";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Popover } from "./Popover";
import { AnnouncementBubble, AnnouncementKeyboard } from "./bubbles/AnnouncementBubble";
import { MeetingBubble, MeetingKeyboard } from "./bubbles/MeetingBubble";
import { PollBubble } from "./bubbles/PollBubble";
import { Foot, Who } from "./bubbles/Shared";
import { TaskBubble, TaskKeyboard } from "./bubbles/TaskBubble";
import { TextBubble } from "./bubbles/TextBubble";
import { useRoom } from "./roomContext";

/** Scroll the touch action bar into view when it opens (it can sit under the composer). */
const revealBar = (el: HTMLDivElement | null) => el?.scrollIntoView({ block: "nearest", behavior: "smooth" });

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
  const [reactOpen, setReactOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [barOpen, setBarOpen] = useState(false);
  const [barConfirm, setBarConfirm] = useState(false);
  const reactBtn = useRef<HTMLButtonElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

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

  const actions = (
    <>
      {canReply ? (
        <button type="button" aria-label="پاسخ" title="پاسخ" onClick={() => { setBarOpen(false); reply(m); }}>
          <Icon name="reply" size={16} />
        </button>
      ) : null}
      {canReact ? (
        <button ref={reactBtn} type="button" aria-label="واکنش" title="واکنش" onClick={() => setReactOpen((v) => !v)}>
          <Icon name="smile" size={16} />
        </button>
      ) : null}
      {canEdit ? (
        <button ref={moreBtn} type="button" aria-label="بیشتر" title="بیشتر" onClick={() => { setMoreOpen((v) => !v); setConfirmDelete(false); }}>
          <Icon name="more" size={16} />
        </button>
      ) : null}
    </>
  );

  return (
    <div className={`row ${mine ? "mine" : "oth"} ${cont ? "grp-cont" : ""}`}>
      {mine ? null : last && m.sender ? <Avatar user={m.sender} className="side" /> : <span className="av side ghost" />}
      <div
        className="bwrap"
        onClick={(e) => {
          // Touch widths have no hover: tap the bubble to reveal the actions bar.
          if (!window.matchMedia("(max-width:820px)").matches || m.delivery || deleted) return;
          if ((e.target as HTMLElement).closest("button,a,input,textarea,label,select,video,audio")) return;
          setBarOpen((v) => !v);
        }}
      >
        {bubble}
        {keyboard}
        {!m.delivery && !deleted ? <div className="b-acts">{actions}</div> : null}
        {barOpen && barConfirm ? (
          <div className="m-acts" ref={revealBar}>
            <b style={{ fontSize: 13 }}>این پیام حذف شود؟</b>
            <button type="button" className="danger" onClick={() => { setBarOpen(false); setBarConfirm(false); void act(`messages/${m.id}`, "DELETE"); }}>
              بله، حذف شود
            </button>
            <button type="button" onClick={() => setBarConfirm(false)}>
              انصراف
            </button>
          </div>
        ) : barOpen ? (
          <div className="m-acts" ref={revealBar}>
            {canReply ? (
              <button type="button" onClick={() => { setBarOpen(false); reply(m); }}>
                <Icon name="reply" size={15} /> پاسخ
              </button>
            ) : null}
            {canReact
              ? QUICK_REACTIONS.map((e) => (
                  <button key={e} type="button" aria-label={`واکنش ${e}`} onClick={() => { setBarOpen(false); toggleReaction(e, !!m.reactions.find((r) => r.emoji === e)?.mine); }}>
                    {e}
                  </button>
                ))
              : null}
            {canEdit ? (
              <>
                <button type="button" onClick={() => { setBarOpen(false); setEditing(true); }}>
                  <Icon name="edit" size={15} /> ویرایش
                </button>
                <button type="button" className="danger" onClick={() => setBarConfirm(true)}>
                  <Icon name="trash" size={15} /> حذف
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      {reactOpen ? (
        <Popover anchor={reactBtn} className="picker emoji-pop" onClose={() => setReactOpen(false)}>
          <div className="emoji-row">
            {QUICK_REACTIONS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`واکنش ${e}`}
                onClick={() => {
                  setReactOpen(false);
                  toggleReaction(e, !!m.reactions.find((r) => r.emoji === e)?.mine);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </Popover>
      ) : null}
      {moreOpen ? (
        <Popover anchor={moreBtn} className="picker more-pop" onClose={() => { setMoreOpen(false); setConfirmDelete(false); }}>
          {confirmDelete ? (
            <div className="more-confirm">
              <b>این پیام حذف شود؟</b>
              <div className="edit-acts">
                <button
                  type="button"
                  className="qa go"
                  onClick={() => {
                    setMoreOpen(false);
                    setConfirmDelete(false);
                    void act(`messages/${m.id}`, "DELETE");
                  }}
                >
                  بله، حذف شود
                </button>
                <button type="button" className="qa" onClick={() => setConfirmDelete(false)}>
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" className="more-item" onClick={() => { setMoreOpen(false); setEditing(true); }}>
                <Icon name="edit" size={15} /> ویرایش
              </button>
              <button type="button" className="more-item danger" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={15} /> حذف
              </button>
            </>
          )}
        </Popover>
      ) : null}
    </div>
  );
}
