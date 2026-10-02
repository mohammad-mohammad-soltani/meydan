"use client";

import Link from "next/link";
import { kindNames, type WorkGroup } from "../types";
import { fa, firstName, listTime } from "../utils";
import { Icon } from "./Icon";
import { WorkIcon } from "./WorkIcon";

/** Last activity of a work group (ISO), used to interleave works with direct chats. */
export const workActivity = (w: WorkGroup) => w.last_message?.created_at ?? w.updated_at ?? "";

/** A work group as a row of the unified conversations list — deliberately richer than a direct chat row. */
export function WorkRow({ w, selected }: { w: WorkGroup; selected: boolean }) {
  const last = w.last_message;
  const preview = last
    ? `${last.sender_name ? firstName(last.sender_name) + ": " : ""}${last.kind !== "text" && last.kind !== "system" ? kindNames[last.kind] + " · " : ""}${last.title || last.body || ""}`
    : w.description || "هنوز پیامی ثبت نشده است";
  const unread = w.viewer.unread_count ?? 0;
  const at = w.viewer.mention_unread ?? 0;
  return (
    <Link className={`wg wk ${selected ? "on" : ""}`} href={`/chat/work/${w.id}`} aria-current={selected ? "page" : undefined}>
      <WorkIcon work={w} />
      <span className="wg-main">
        <b>
          <span className="wk-title">{w.title}</span>
          <span className="wk-badge">
            <Icon name="task" size={11} weight={2.2} />
            کار
          </span>
          <span className="wk-members" title="تعداد اعضا">
            <Icon name="users" size={11} />
            {fa(w.member_count)}
          </span>
        </b>
        <span className="last">{preview}</span>
      </span>
      <span className="wg-side">
        <span>{listTime(last?.created_at ?? w.updated_at)}</span>
        <span className="badges">
          {at ? <span className="at">@</span> : null}
          {unread ? <span className="unread num">{fa(unread)}</span> : null}
        </span>
        {w.viewer.joined ? null : <span className="wg-guest">عضو نیستید</span>}
      </span>
    </Link>
  );
}
