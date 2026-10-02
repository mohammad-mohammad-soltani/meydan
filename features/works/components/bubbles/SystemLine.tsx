"use client";

import type { WorkMessage } from "../../types";

const TEXT: Record<string, string> = {
  joined: "به کار پیوست",
  left: "از کار خارج شد",
  task_claimed: "داوطلب انجام وظیفه شد",
  task_dropped: "از داوطلبی وظیفه انصراف داد",
  task_started: "کار را شروع کرد",
  task_paused: "وظیفه را متوقف کرد",
  task_done: "کار را انجام‌شده اعلام کرد",
  task_approved: "کار را تأیید نهایی کرد",
  task_reopened: "کار را برای اصلاح برگرداند",
  task_assigned: "را مسئول کرد",
  task_unassigned: "را از مسئولیت برداشت",
  task_nudged: "یادآوری فرستاد",
  role_admin: "را ادمین کرد",
  role_member: "را از ادمینی برداشت",
};

/** Centered service line (mock `.svc`). Clicking it jumps to the message it is about. */
export function SystemLine({ m, group, onJump }: { m: WorkMessage; group?: WorkMessage[]; onJump: (id: string) => void }) {
  const s = m.system;
  if (group && group.length > 1) {
    // A run of "X joined" / "X left" lines collapses into one: "A, B and N others joined".
    const names = group.map((g) => g.sender?.name ?? "کاربر");
    const verb = s?.action === "left" ? "از کار خارج شدند" : "به کار پیوستند";
    const shown = names.slice(0, 2).join("، ");
    return (
      <div className="svc" style={{ cursor: "default" }}>
        <b>{shown}</b>
        {names.length > 2 ? <> و {names.length - 2} نفر دیگر</> : null} {verb}
      </div>
    );
  }
  const text = TEXT[s?.action ?? ""] ?? "کار را به‌روز کرد";
  const target = s?.target_user?.name;
  const title = s?.target_title;
  const jumpable = !!s?.target_message_id;
  return (
    <button type="button" className="svc" disabled={!jumpable} style={jumpable ? undefined : { cursor: "default" }} onClick={() => s?.target_message_id && onJump(s.target_message_id)}>
      <b>{m.sender?.name ?? "کاربر"}</b>{m.sender?.work_label ? <span className="u-label">{m.sender.work_label}</span> : null}{" "}
      {/* "X را مسئول کرد" reads target first: "X <name> را مسئول کرد" → show the person before the verb */}
      {target && text.startsWith("را ") ? (
        <>
          <b>{target}</b> {text}
        </>
      ) : (
        <>
          {text}
          {target ? (
            <>
              {" "}
              <b>{target}</b>
            </>
          ) : null}
        </>
      )}
      {title ? <> — «{title.length > 40 ? title.slice(0, 40) + "…" : title}»</> : null}
    </button>
  );
}
