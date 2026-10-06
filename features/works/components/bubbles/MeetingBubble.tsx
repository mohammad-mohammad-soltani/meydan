"use client";

import type { ReactNode } from "react";
import { fa } from "../../utils";
import type { WorkMessage } from "../../types";
import { Person } from "../Avatar";
import { Icon } from "../Icon";
import { useRoom } from "../roomContext";
import { Attachment, Foot, Reactions, Who } from "./Shared";
import { TitleBody } from "./TitleBody";

export function MeetingKeyboard({ m }: { m: WorkMessage }) {
  const { act, guard } = useRoom();
  const g = m.meeting!;
  const set = (response: "yes" | "no") => guard() && void act(`meetings/${m.id}/rsvp`, "PUT", { response: g.my_response === response ? null : response });
  return (
    <div className="kb">
      <button className={g.my_response === "yes" ? "ok" : "go"} onClick={() => set("yes")} aria-pressed={g.my_response === "yes"}>
        {g.my_response === "yes" ? "✓ می‌آیم" : "شرکت می‌کنم"} · {fa(g.going)}
      </button>
      <button className={g.my_response === "no" ? "ok" : ""} onClick={() => set("no")} aria-pressed={g.my_response === "no"}>
        نمی‌توانم · {fa(g.not_going)}
      </button>
    </div>
  );
}

export function MeetingBubble({
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
  const { viewerId } = useRoom();
  const g = m.meeting!;
  return (
    <div className={`bub rich t-meeting ${rel ? "rel" : ""}`} id={`work-message-${m.id}`}>
      <div className="rich-h">
        <Icon name="meeting" size={14} />
        جلسه
        {m.is_private ? <span className="prio">جلسه خصوصی</span> : null}
        <span className="sp" />
        <span className="stl">{g.when.split(" ").slice(0, 2).join(" ")}</span>
      </div>
      <div className="rich-b">
        {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
        <TitleBody m={m} viewerId={viewerId} editing={editing} onSave={onSave} onCancel={onCancel} />
        <Attachment m={m} />
        <div className="facts">
          <div className="fact urg">
            <Icon name="clock" size={15} />
            <b>زمان</b>
            <span>{g.when || "زمان اعلام می‌شود"}</span>
          </div>
          {g.place ? (
            <div className="fact">
              <Icon name="pin" size={15} />
              <b>مکان</b>
              <span>{g.place}</span>
            </div>
          ) : null}
          {g.agenda ? (
            <div className="fact">
              <Icon name="mic" size={15} />
              <b>دستور</b>
              <span>{g.agenda}</span>
            </div>
          ) : null}
          {m.is_private && g.invited?.length ? (
            <div className="fact">
              <Icon name="at" size={15} />
              <b>دعوت</b>
              <div className="people">
                {g.invited.map((u) => (
                  <Person key={u.id} user={u} viewerId={viewerId} className="tagp" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {kb}
        <Reactions m={m} onToggle={onReact} />
        <Foot m={m} mine={mine} />
      </div>
    </div>
  );
}
