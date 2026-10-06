"use client";

import Link from "next/link";
import type { Route } from "next";
import type { Conversation } from "../types";
import { ChatAvatar } from "./ChatAvatar";
import { ChTick } from "./ChIcon";
import { AccountBadges } from "@/components/shared/AccountBadges";

/** A direct conversation as a selectable row of the two-pane conversations list (reference `.ch-r`). */
export function DirectRow({ conversation, selected }: { conversation: Conversation; selected: boolean }) {
  const { participant } = conversation;
  const unread = conversation.unreadCount;
  return (
    <Link className={`ch-r ${selected ? "on" : ""}`} href={`/chat/${conversation.id}` as Route} aria-current={selected ? "page" : undefined}>
      <ChatAvatar participant={participant} className="h-[52px] w-[52px]" textClassName="text-xl" />
      <span className="ch-rb">
        <span className="ch-r1">
          <b>{participant.name}</b>
          <AccountBadges verified={participant.isVerified} speaker={participant.isSpeaker} official={participant.isOfficial} kind={participant.profileType} size="md" />
          <time>{conversation.updatedAt}</time>
        </span>
        <span className="ch-r2">
          <span className="ch-lm">
            {unread === 0 ? <ChTick /> : null}
            {conversation.preview}
          </span>
          {unread > 0 ? <i className="ch-un">{unread > 99 ? "۹۹+" : unread.toLocaleString("fa-IR")}</i> : null}
        </span>
      </span>
    </Link>
  );
}
