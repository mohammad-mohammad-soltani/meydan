"use client";

import { kindNames, type WorkKind, type WorkMessage } from "../../types";

/** Quoted parent message (mock `.quote`). */
export function Quote({ reply, onJump }: { reply: NonNullable<WorkMessage["reply_to"]>; onJump: (id: string) => void }) {
  const kind = reply.kind in kindNames ? (reply.kind as WorkKind) : "text";
  const text = (reply.title || reply.body || "").replace(/\s+/g, " ");
  return (
    <button type="button" className="quote" onClick={() => onJump(reply.id)}>
      <b>
        {reply.sender_name}
        {reply.sender_label ? <span className="u-label">{reply.sender_label}</span> : null}
      </b>
      <span>
        {kind !== "text" ? kindNames[kind] + ": " : ""}
        {text.length > 70 ? text.slice(0, 70) + "…" : text}
      </span>
    </button>
  );
}
