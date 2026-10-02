"use client";

import type { CSSProperties } from "react";
import { kindNames, type WorkKind, type WorkMessage } from "../../types";
import { nameColor } from "../../utils";

/** Quoted parent message (mock `.quote`). */
export function Quote({ reply, onJump }: { reply: NonNullable<WorkMessage["reply_to"]>; onJump: (id: string) => void }) {
  const kind = reply.kind in kindNames ? (reply.kind as WorkKind) : "text";
  const text = (reply.title || reply.body || "").replace(/\s+/g, " ");
  return (
    <button type="button" className="quote" style={{ "--qc": nameColor(reply.sender_name || reply.id) } as CSSProperties} onClick={() => onJump(reply.id)}>
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
