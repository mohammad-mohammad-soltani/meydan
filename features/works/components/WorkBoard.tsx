"use client";

import type { CSSProperties } from "react";
import type { WorkMessage } from "../types";
import { dayLabel, fa, STATUS_LABEL } from "../utils";
import { Avatar } from "./Avatar";
import { Icon, StatusIcon } from "./Icon";
import { useRoom } from "./roomContext";

const COLUMNS = [
  { id: "todo", label: "باز" },
  { id: "doing", label: "در حال انجام" },
  { id: "done", label: "انجام شد" },
] as const;

function Card({ m, onOpen }: { m: WorkMessage; onOpen: (id: string) => void }) {
  const { manager, member, act, guard, viewerId } = useRoom();
  const t = m.task!;
  const mine = t.viewer_is_responsible;
  const people = [...t.assignees, ...t.volunteers];
  const dn = t.items.filter((c) => c.done).length;
  const rel = mine || m.mentions.some((u) => u.id === viewerId);
  const quick = (action: string, label: string, color?: string) => (
    <button
      type="button"
      className="qa go"
      style={color ? ({ "--qc": color } as CSSProperties) : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (guard()) void act(`tasks/${m.id}/status`, "PUT", { action });
      }}
    >
      {label}
    </button>
  );
  return (
    <div className={`card ${rel ? "rel" : ""}`} role="button" tabIndex={0} onClick={() => onOpen(m.id)} onKeyDown={(e) => e.key === "Enter" && onOpen(m.id)}>
      <h4>
        {t.priority === "high" ? <span className="prio">فوری</span> : null} {t.title}
      </h4>
      {t.items.length ? (
        <div className="mini-bar">
          <span style={{ width: `${(dn / t.items.length) * 100}%` }} />
        </div>
      ) : null}
      <div className="card-m">
        <span className={t.late || t.soon ? "urg" : ""}>
          <Icon name="clock" size={12} /> {t.late ? "دیرکرد · " : ""}
          {t.due_at ? dayLabel(t.due_at) : "بدون مهلت"}
        </span>
        {people.length ? (
          <span className="astack">
            {people.slice(0, 3).map((u) => (
              <Avatar key={u.id} user={u} />
            ))}
            {people.length > 3 ? <span className="more">+{fa(people.length - 3)}</span> : null}
          </span>
        ) : (
          <span className="slot" style={{ fontSize: 10.5 }}>
            بدون مسئول
          </span>
        )}
      </div>
      {t.status === "ok" ? (
        <div className="card-m">
          <span style={{ color: "var(--ok)", fontWeight: 800 }}>✓✓ {STATUS_LABEL.ok}</span>
        </div>
      ) : null}
      {member && t.status !== "ok" ? (
        <div className="card-acts">
          {t.status === "todo" && mine ? quick("start", "شروع", "var(--s2)") : null}
          {t.status === "doing" && mine ? quick("finish", "انجام شد", "var(--ok)") : null}
          {t.status === "done" && manager ? quick("approve", "تأیید", "var(--ok)") : null}
        </div>
      ) : null}
    </div>
  );
}

/** Kanban view of the work's tasks (mock `boardHtml`). */
export function WorkBoard({ tasks, onOpen, loading }: { tasks: WorkMessage[]; onOpen: (id: string) => void; loading: boolean }) {
  return (
    <div className="board">
      {COLUMNS.map((c) => {
        const items = tasks.filter((m) => m.task && (c.id === "done" ? m.task.status === "done" || m.task.status === "ok" : m.task.status === c.id));
        return (
          <div className="col" key={c.id}>
            <div className="col-h">
              <StatusIcon status={c.id} size={15} />
              {c.label}
              <span className="num">{fa(items.length)}</span>
            </div>
            {items.map((m) => (
              <Card key={m.id} m={m} onOpen={onOpen} />
            ))}
            {!items.length ? (
              <p className="hint" style={{ padding: 6 }}>
                {loading ? "در حال دریافت…" : "خالی"}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
