"use client";

import { SendHorizontal, Trash2 } from "lucide-react";
import { formatVoiceTime } from "../voice/voice-utils";

/** Composer while recording: discard · pulsing dot + timer · live loudness bars · send. */
export function VoiceRecorderBar({
  elapsed,
  levels,
  onCancel,
  onSend,
}: {
  elapsed: number;
  levels: number[];
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <div className="voice-rec flex items-center gap-2" role="group" aria-label="در حال ضبط پیام صوتی">
      <button type="button" onClick={onCancel} aria-label="لغو ضبط" className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full text-danger transition-colors hover:bg-hover active:scale-90">
        <Trash2 className="h-[22px] w-[22px]" />
      </button>
      <div className="flex h-[46px] min-w-0 flex-1 items-center gap-3 rounded-[23px] border border-border bg-surface-muted px-4" aria-live="off">
        <span className="voice-rec-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#e4152e]" aria-hidden="true" />
        <span className="w-10 shrink-0 text-[13.5px] font-semibold tabular-nums text-foreground" dir="ltr">{formatVoiceTime(elapsed)}</span>
        <div dir="ltr" className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[2px] overflow-hidden" aria-hidden="true">
          {levels.map((level, index) => (
            <span key={index} className="block w-[3px] shrink-0 rounded-full bg-foreground/70 transition-[height] duration-100" style={{ height: `${Math.round(14 + level * 86)}%` }} />
          ))}
        </div>
      </div>
      <button type="button" onClick={onSend} aria-label="ارسال پیام صوتی" style={{ color: "var(--m-bg)" }} className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-foreground transition-transform active:scale-90">
        <SendHorizontal className="h-5 w-5 rotate-180" />
      </button>
    </div>
  );
}
