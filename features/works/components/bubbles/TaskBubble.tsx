"use client";

import { useRef, useState, type ReactNode } from "react";
import type { WorkMessage, WorkUser } from "../../types";
import { dateTimeLabel, fa, STATUS_LABEL } from "../../utils";
import { Icon, StatusIcon } from "../Icon";
import { Person } from "../Avatar";
import { PeoplePicker } from "../PeoplePicker";
import { useRoom } from "../roomContext";
import { Attachment, Foot, Reactions, Who } from "./Shared";
import { TitleBody } from "./TitleBody";

const STEPS = ["todo", "doing", "done", "ok"] as const;

/** Who may tick / add / remove sub-tasks: managers and the people on the task. */
function useCanEdit(m: WorkMessage) {
  const { manager, member } = useRoom();
  return member && (manager || !!m.task?.viewer_is_responsible);
}

function Checklist({ m }: { m: WorkMessage }) {
  const { act, guard } = useRoom();
  const t = m.task!;
  const can = useCanEdit(m);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const done = t.items.filter((c) => c.done).length;
  if (!t.items.length && !can) return null;
  return (
    <div className="cl">
      <div className="cl-h">
        <span>زیرکارها</span>
        <span className="num">
          {fa(done)} از {fa(t.items.length)}
        </span>
      </div>
      {t.items.map((c) => (
        <div className="cl-row" key={c.id}>
          {editing === c.id ? (
            <input
              autoFocus
              className="cl-edit"
              value={draft}
              aria-label="ویرایش زیرکار"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => setEditing(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(null);
                if (e.key === "Enter" && draft.trim()) {
                  e.preventDefault();
                  const title = draft;
                  setEditing(null);
                  void act(`task-items/${c.id}`, "PATCH", { title });
                }
              }}
            />
          ) : (
            <label className={c.done ? "d" : ""}>
              <input
                type="checkbox"
                checked={c.done}
                disabled={!can}
                onChange={(e) => guard() && void act(`task-items/${c.id}`, "PATCH", { done: e.target.checked })}
              />
              <span>{c.title}</span>
            </label>
          )}
          {can && editing !== c.id ? (
            <span className="cl-tools">
              <button
                type="button"
                aria-label={`ویرایش ${c.title}`}
                onClick={() => {
                  setEditing(c.id);
                  setDraft(c.title);
                }}
              >
                <Icon name="edit" size={13} />
              </button>
              <button type="button" aria-label={`حذف ${c.title}`} onClick={() => void act(`task-items/${c.id}`, "DELETE")}>
                <Icon name="close" size={13} />
              </button>
            </span>
          ) : null}
        </div>
      ))}
      {can ? (
        <input
          className="cl-add"
          placeholder="+ زیرکار (Enter)"
          aria-label="زیرکار جدید"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              e.preventDefault();
              const title = text;
              setText("");
              void act(`tasks/${m.id}/items`, "POST", { title });
            }
          }}
        />
      ) : null}
    </div>
  );
}

function Details({ m }: { m: WorkMessage }) {
  const { work, manager, member, viewerId, act } = useRoom();
  const t = m.task!;
  const anchor = useRef<HTMLButtonElement>(null);
  const [pick, setPick] = useState(false);
  const [people, setPeople] = useState<WorkUser[]>(t.assignees);
  const ci = STEPS.indexOf(t.status);
  const acts: ReactNode[] = [];
  if (t.volunteers.some((u) => u.id === viewerId) && t.status !== "ok")
    acts.push(
      <button key="drop" type="button" className="qa" onClick={() => void act(`tasks/${m.id}/claim`, "DELETE")}>
        انصراف از داوطلبی
      </button>,
    );
  if (manager && t.status === "done")
    acts.push(
      <button key="reopen" type="button" className="qa" onClick={() => void act(`tasks/${m.id}/status`, "PUT", { action: "reopen" })}>
        برگشت برای اصلاح
      </button>,
    );
  if (manager && (t.status === "todo" || t.status === "doing") && (t.assignees.length || t.volunteers.length))
    acts.push(
      <button key="nudge" type="button" className="qa" onClick={() => void act(`tasks/${m.id}/nudge`, "POST")}>
        <Icon name="bell" size={13} /> یادآوری به مسئول
      </button>,
    );
  void member;
  return (
    <div className="details">
      <div className="stepper">
        {STEPS.map((s, i) => (
          <span key={s} className={i < ci ? "past" : i === ci ? "cur" : ""}>
            <StatusIcon status={s} size={13} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
      <div className="roles">
        <b>مسئول</b>
        <div className="people">
          {t.assignees.length ? t.assignees.map((u) => <Person key={u.id} user={u} viewerId={viewerId} />) : <span className="slot">تعیین نشده</span>}
          {manager ? (
            <button ref={anchor} type="button" className="edit-pp" onClick={() => setPick((v) => !v)}>
              <Icon name="user" size={12} /> واگذاری
            </button>
          ) : null}
        </div>
        {t.capacity || t.volunteers.length ? (
          <>
            <b>داوطلب</b>
            <div className="people">
              {t.volunteers.map((u) => (
                <Person key={u.id} user={u} viewerId={viewerId} />
              ))}
              {Array.from({ length: Math.min(t.open_slots ?? 0, 8) }, (_, i) => (
                <span className="slot" key={i}>
                  جای خالی
                </span>
              ))}
            </div>
          </>
        ) : null}
        <b>تگ‌شده</b>
        <div className="people">
          {m.mentions.length ? m.mentions.map((u) => <Person key={u.id} user={u} viewerId={viewerId} className="tagp" />) : <span className="slot">کسی تگ نشده</span>}
        </div>
      </div>
      {pick ? (
        <PeoplePicker
          anchor={anchor}
          workId={work.id}
          title="واگذاری وظیفه"
          sub="مسئول‌ها اعلان می‌گیرند؛ با تعیین مسئول، داوطلبی بسته می‌شود"
          value={people}
          onChange={setPeople}
          onClose={() => {
            setPick(false);
            const same = people.length === t.assignees.length && people.every((p) => t.assignees.some((a) => a.id === p.id));
            if (!same) void act(`tasks/${m.id}/people`, "PUT", { assignee_ids: people.map((u) => Number(u.id)) });
          }}
        />
      ) : null}
      <Checklist m={m} />
      {acts.length ? <div className="more-acts">{acts}</div> : null}
    </div>
  );
}

/** Primary inline-keyboard buttons under a task (mock `taskKb`). */
export function TaskKeyboard({ m }: { m: WorkMessage }) {
  const { manager, member, act, guard, detailsOpen, toggleDetails } = useRoom();
  const t = m.task!;
  const mine = t.viewer_is_responsible;
  const free = !t.assignees.length && (t.open_slots === null || t.open_slots > 0);
  const btns: ReactNode[] = [];
  if (t.status === "ok")
    btns.push(
      <button key="s" className="ok" disabled>
        ✓✓ تأیید شد
      </button>,
    );
  else if (t.status === "done")
    btns.push(
      manager ? (
        <button key="s" className="go" onClick={() => void act(`tasks/${m.id}/status`, "PUT", { action: "approve" })}>
          تأیید نهایی
        </button>
      ) : (
        <button key="s" className="ok" disabled>
          ✓ انجام شد
        </button>
      ),
    );
  else if (mine && t.status === "todo")
    btns.push(
      <button key="s" className="go" style={{ ["--tc" as string]: "var(--s2)" }} onClick={() => void act(`tasks/${m.id}/status`, "PUT", { action: "start" })}>
        ▶ شروع می‌کنم
      </button>,
    );
  else if (mine && t.status === "doing")
    btns.push(
      <button key="s" className="go" onClick={() => void act(`tasks/${m.id}/status`, "PUT", { action: "finish" })}>
        ✓ انجام شد
      </button>,
    );
  else if (free && (t.status === "todo" || t.status === "doing") && !mine)
    btns.push(
      <button key="s" className="go" onClick={() => guard() && void act(`tasks/${m.id}/claim`, "POST")}>
        ✋ من هم هستم
      </button>,
    );
  void member;
  btns.push(
    <button key="d" onClick={() => toggleDetails(m.id)} aria-expanded={detailsOpen.has(m.id)}>
      {detailsOpen.has(m.id) ? "بستن جزئیات" : "جزئیات"}
    </button>,
  );
  return <div className="kb">{btns}</div>;
}

export function TaskBubble({
  m,
  mine,
  showWho,
  rel,
  editing,
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
  onSave: (patch: { title?: string; body: string }) => Promise<void>;
  onCancel: () => void;
  onReact: (emoji: string, mine: boolean) => void;
  /** Inline keyboard (reference `.rk-st` / `.rk-r`): lives inside the card, above the time. */
  kb?: ReactNode;
}) {
  const { viewerId, detailsOpen } = useRoom();
  const t = m.task!;
  const done = t.status === "done" || t.status === "ok";
  const people = [...t.assignees, ...t.volunteers];
  const dn = t.items.filter((c) => c.done).length;
  const replies = m.reply_count ?? 0;
  return (
    <div className={`bub rich t-task ${rel ? "rel" : ""}`} id={`work-message-${m.id}`}>
      <div className="rich-h">
        <Icon name="task" size={14} />
        وظیفه
        {t.priority === "high" ? <span className="prio">فوری</span> : t.priority === "low" ? <span className="prio low">کم‌اهمیت</span> : null}
        <span className="sp" />
        <span className="stl">
          <StatusIcon status={t.status} size={14} />
          {STATUS_LABEL[t.status]}
        </span>
      </div>
      <div className="rich-b">
        {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
        <TitleBody m={m} viewerId={viewerId} editing={editing} onSave={onSave} onCancel={onCancel} />
        <Attachment m={m} />
        <div className="facts">
          <div className="fact">
            <Icon name="user" size={15} />
            <b>مسئول</b>
            {people.length ? (
              <div className="people">
                {people.map((u) => (
                  <Person key={u.id} user={u} viewerId={viewerId} className={done ? "st-done" : ""} />
                ))}
              </div>
            ) : (
              <span style={{ color: "var(--faint)" }}>—</span>
            )}
          </div>
          {m.mentions.length ? (
            <div className="fact">
              <Icon name="at" size={15} />
              <b>تگ</b>
              <div className="people">
                {m.mentions.map((u) => (
                  <Person key={u.id} user={u} viewerId={viewerId} className="tagp" />
                ))}
              </div>
            </div>
          ) : null}
          {t.due_at ? (
            <div className={`fact ${t.late || t.soon ? "urg" : ""}`}>
              <Icon name="clock" size={15} />
              <b>مهلت</b>
              <span>
                {t.late ? "دیرکرد · " : ""}
                {dateTimeLabel(t.due_at)}
              </span>
            </div>
          ) : null}
          {t.items.length ? (
            <div className="fact">
              <Icon name="task" size={15} />
              <b>پیشرفت</b>
              <div className="prog">
                <span className="tr">
                  <span style={{ width: `${(dn / t.items.length) * 100}%` }} />
                </span>
                <span className="num">
                  {fa(dn)}/{fa(t.items.length)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        {kb}
        <Reactions m={m} onToggle={onReact} />
        <Foot m={m} mine={mine} extra={replies ? <span>· {fa(replies)} پاسخ</span> : null} />
      </div>
      {detailsOpen.has(m.id) ? <Details m={m} /> : null}
    </div>
  );
}
