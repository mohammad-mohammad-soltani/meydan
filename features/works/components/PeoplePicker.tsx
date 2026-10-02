"use client";

import { useState, type RefObject } from "react";
import type { WorkUser } from "../types";
import { fa } from "../utils";
import { MemberList } from "./MemberPicker";
import { Popover } from "./Popover";

/** Multi-select popover (mock `renderPicker`): assignees, tags, private-meeting audience. */
export function PeoplePicker({
  anchor,
  workId,
  title,
  sub,
  value,
  onChange,
  onClose,
}: {
  anchor: RefObject<HTMLElement | null>;
  workId: string;
  title: string;
  sub: string;
  value: WorkUser[];
  onChange: (users: WorkUser[]) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const toggle = (u: WorkUser) => onChange(value.some((v) => v.id === u.id) ? value.filter((v) => v.id !== u.id) : [...value, u]);
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="pk-h">
        <b>{title}</b>
        <small>{sub}</small>
        <input autoFocus placeholder="جستجوی عضو" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" aria-label="جستجوی عضو" />
      </div>
      <MemberList workId={workId} query={q} mode="multi" selected={value.map((v) => v.id)} onToggle={toggle} />
      <div className="pk-f">
        <span>{fa(value.length)} نفر انتخاب شده</span>
        <button type="button" className="btn primary" onClick={onClose}>
          تأیید
        </button>
      </div>
    </Popover>
  );
}
