"use client";

import type { WorkMessage } from "../../types";
import { useRoom } from "../roomContext";
import { Attachment, Foot, Reactions, Who } from "./Shared";
import { Quote } from "./Quote";
import { TitleBody } from "./TitleBody";

export function TextBubble({
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
  const { viewerId, jump } = useRoom();
  if (m.deleted_at)
    return (
      <div className="bub deleted" id={`work-message-${m.id}`}>
        {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
        <div className="txt">این پیام حذف شده است.</div>
        <Foot m={m} mine={false} />
      </div>
    );
  return (
    <div className={`bub ${rel ? "rel" : ""} ${m.delivery === "failed" ? "failed" : ""}`} id={`work-message-${m.id}`}>
      {!mine && showWho ? <Who user={m.sender} role={m.sender_role} /> : null}
      {m.reply_to ? <Quote reply={m.reply_to} onJump={jump} /> : null}
      <TitleBody m={m} viewerId={viewerId} editing={editing} onSave={onSave} onCancel={onCancel} />
      <Attachment m={m} />
      <Reactions m={m} onToggle={onReact} />
      <Foot m={m} mine={mine} />
    </div>
  );
}
