"use client";

import Link from "next/link";
import { ChIcon } from "@/features/chat/components/ChIcon";
import { kindNames, type WorkGroup } from "../types";
import { fa, firstName, listTime } from "../utils";
import { WorkIcon } from "./WorkIcon";

/** Last activity of a work group (ISO), used to interleave works with direct chats. */
export const workActivity = (w: WorkGroup) => w.last_message?.created_at ?? w.updated_at ?? "";

/** A work group as a row of the unified conversations list (reference `.ch-r` with the «کار» badge). */
export function WorkRow({ w, selected }: { w: WorkGroup; selected: boolean }) {
  const last = w.last_message;
  const preview = last
    ? `${last.sender_name ? firstName(last.sender_name) + ": " : ""}${last.kind !== "text" && last.kind !== "system" ? kindNames[last.kind] + " · " : ""}${last.title || last.body || ""}`
    : w.description || "هنوز پیامی ثبت نشده است";
  const unread = w.viewer.unread_count ?? 0;
  const at = w.viewer.mention_unread ?? 0;
  return (
    <Link className={`ch-r ${selected ? "on" : ""}`} href={`/chat/work/${w.id}`} aria-current={selected ? "page" : undefined}>
      <WorkIcon work={w} />
      <span className="ch-rb">
        <span className="ch-r1">
          <b>{w.title}</b>
          <u className="ch-bd w">
            <ChIcon name="task" size={12} /> کار
          </u>
          <small className="ch-mc" title="تعداد اعضا">
            <ChIcon name="usr" size={12} />
            {fa(w.member_count)}
          </small>
          <time>{listTime(last?.created_at ?? w.updated_at)}</time>
        </span>
        <span className="ch-r2">
          {w.viewer.joined ? null : <u className="ch-bd">عضو نیستید</u>}
          <span className="ch-lm">{preview}</span>
          {at ? <i className="ch-un">@</i> : null}
          {unread ? <i className="ch-un">{fa(unread)}</i> : null}
        </span>
      </span>
    </Link>
  );
}
