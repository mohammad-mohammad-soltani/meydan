"use client";

import { useState } from "react";
import type { WorkMessage } from "../../types";
import { messageTitle } from "../../types";
import { RichText } from "./Shared";

/**
 * Title + description of a message, or its inline editor while `editing`.
 * Text messages have no title (the body is the message).
 */
export function TitleBody({
  m,
  viewerId,
  editing,
  onSave,
  onCancel,
  titleClass = "rich-t",
}: {
  m: WorkMessage;
  viewerId: string;
  editing: boolean;
  onSave: (patch: { title?: string; body: string }) => Promise<void>;
  onCancel: () => void;
  titleClass?: string;
}) {
  const rich = m.kind !== "text";
  const [title, setTitle] = useState(messageTitle(m));
  const [body, setBody] = useState(m.body);
  const [busy, setBusy] = useState(false);

  if (editing)
    return (
      <div className="edit-box">
        {rich ? <input className="t-in" aria-label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} /> : null}
        <textarea aria-label="متن پیام" value={body} rows={3} onChange={(e) => setBody(e.target.value)} />
        <div className="edit-acts">
          <button
            type="button"
            className="qa go"
            disabled={busy || (rich ? !title.trim() : !body.trim())}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave({ ...(rich ? { title } : {}), body });
              } finally {
                setBusy(false);
              }
            }}
          >
            ذخیره
          </button>
          <button type="button" className="qa" onClick={onCancel}>
            انصراف
          </button>
        </div>
      </div>
    );

  return (
    <>
      {rich ? <div className={titleClass}>{messageTitle(m)}</div> : null}
      {m.body ? (
        <div className="txt">
          <RichText text={m.body} mentions={m.mentions} viewerId={viewerId} />
        </div>
      ) : null}
    </>
  );
}
