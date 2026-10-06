"use client";

import type { ReactNode } from "react";
import { splitMentions } from "../../mention";
import { VoiceMessage } from "@/features/chat/components/VoiceMessage";
import type { WorkMessage, WorkRole, WorkUser } from "../../types";
import { bareHandle, timeLabel } from "../../utils";
import { useRoom } from "../roomContext";

export const TICK = (
  <svg className="ticks" width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="m1 6 3 3 6-7M6 8l1 1 6-7" />
  </svg>
);

/** Attribute (صفت) chip shown right after a person's name. */
export function UserLabel({ label }: { label?: string | null }) {
  return label ? <span className="u-label">{label}</span> : null;
}

/** Author line: coloured name + role badge (مدیر / ادمین). */
export function Who({ user, role }: { user: WorkUser | null; role?: WorkRole | null }) {
  if (!user) return null;
  return (
    <div className="who">
      {user.name}
      <UserLabel label={user.work_label} />
      {role === "owner" ? <span className="role-b admin">مدیر</span> : role === "admin" ? <span className="role-b lead">ادمین</span> : null}
    </div>
  );
}

/** Message text with @handle mentions swapped for highlighted display names. */
export function RichText({ text, mentions, viewerId }: { text: string; mentions: WorkUser[]; viewerId: string }) {
  return (
    <>
      {splitMentions(text).map((part, i) => {
        if (!part.mention) return <span key={i}>{part.text}</span>;
        const handle = part.text.slice(1).toLowerCase();
        const user = mentions.find((u) => bareHandle(u).toLowerCase() === handle);
        const me = !!user && user.id === viewerId;
        return (
          <span key={i} className={`mention ${me ? "me" : ""}`}>
            @{me ? "شما" : (user?.name ?? part.text.slice(1))}
          </span>
        );
      })}
    </>
  );
}

/** Footer: ticks (own), time, extras — direction is forced LTR by the stylesheet like the reference. */
export function Foot({ m, mine, extra }: { m: WorkMessage; mine: boolean; extra?: ReactNode }) {
  return (
    <div className="foot">
      {mine && !m.delivery ? TICK : null}
      <span>{m.delivery === "sending" ? "در حال ارسال…" : timeLabel(m.created_at)}</span>
      {m.edited_at ? <span>· ویرایش‌شده</span> : null}
      {extra}
    </div>
  );
}

export const Reactions = ({ m, onToggle }: { m: WorkMessage; onToggle: (emoji: string, mine: boolean) => void }) =>
  m.reactions.length ? (
    <div className="reacts">
      {m.reactions.map((r) => (
        <button key={r.emoji} type="button" className={r.mine ? "on" : ""} aria-pressed={r.mine} onClick={() => onToggle(r.emoji, r.mine)}>
          {r.emoji}
          <span className="num">{r.count.toLocaleString("fa-IR")}</span>
        </button>
      ))}
    </div>
  ) : null;

export function Attachment({ m }: { m: WorkMessage }) {
  const { viewerId } = useRoom();
  const a = m.attachment;
  if (!a) return null;
  if (a.voice && a.mime_type.startsWith("audio/"))
    return (
      <div className="attachment">
        <VoiceMessage attachment={{ id: a.id, name: a.name, mimeType: a.mime_type, size: 0, url: a.url, duration: a.duration, voice: true, waveform: a.waveform }} transfer={null} isOwn={!!viewerId && m.sender?.id === viewerId} />
      </div>
    );
  return (
    <div className="attachment">
      {a.mime_type.startsWith("image/") ? (
        <a href={a.url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt={a.name} loading="lazy" />
        </a>
      ) : a.mime_type.startsWith("video/") ? (
        <video src={a.url} controls preload="metadata" />
      ) : a.mime_type.startsWith("audio/") ? (
        <audio src={a.url} controls preload="metadata" />
      ) : null}
      <a href={a.url} target="_blank" rel="noreferrer">
        {a.name}
      </a>
    </div>
  );
}
