"use client";

import type { WorkMessage } from "../../types";
import { fa } from "../../utils";
import { Icon } from "../Icon";
import { useRoom } from "../roomContext";
import { Attachment, Foot, Reactions, Who } from "./Shared";
import { TitleBody } from "./TitleBody";

export function PollBubble({
  m,
  mine,
  showWho,
  rel,
  editing,
  onSave,
  onCancel,
  onReact,
}: {
  m: WorkMessage;
  mine: boolean;
  showWho: boolean;
  rel: boolean;
  editing: boolean;
  onSave: (patch: { title?: string; body: string }) => Promise<void>;
  onCancel: () => void;
  onReact: (emoji: string, mine: boolean) => void;
}) {
  const { viewerId, act, guard } = useRoom();
  const p = m.poll!;
  const voted = p.my_vote !== null;
  return (
    <div className={`bub rich t-poll ${rel ? "rel" : ""}`} id={`work-message-${m.id}`}>
      <div className="rich-h">
        <Icon name="poll" size={14} />
        نظرسنجی
        <span className="sp" />
        <span className="stl">{fa(p.total)} رأی</span>
      </div>
      <div className="rich-b">
        {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
        {editing ? (
          <TitleBody m={m} viewerId={viewerId} editing onSave={onSave} onCancel={onCancel} />
        ) : (
          <>
            <div className="poll-q">{p.question}</div>
            {m.body ? <TitleBody m={{ ...m, kind: "text" }} viewerId={viewerId} editing={false} onSave={onSave} onCancel={onCancel} /> : null}
            <div className="poll-k">{voted ? "با زدن گزینه دیگر رأی‌تان عوض می‌شود" : "یک گزینه را انتخاب کنید"}</div>
          </>
        )}
        <Attachment m={m} />
        {p.options.map((o, i) => {
          const pct = p.total ? Math.round((o.votes / p.total) * 100) : 0;
          return (
            <button
              key={i}
              type="button"
              className={`popt ${p.my_vote === i ? "mine" : ""}`}
              aria-pressed={p.my_vote === i}
              onClick={() => guard() && void act(`polls/${m.id}/vote`, "PUT", { option: i })}
            >
              <span className="rd">{p.my_vote === i ? "✓" : ""}</span>
              <span>{o.text}</span>
              {voted ? (
                <>
                  <b className="num">{fa(pct)}٪</b>
                  <span className="bar">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                </>
              ) : (
                <b />
              )}
            </button>
          );
        })}
        <Reactions m={m} onToggle={onReact} />
        <Foot m={m} mine={mine} />
      </div>
    </div>
  );
}
