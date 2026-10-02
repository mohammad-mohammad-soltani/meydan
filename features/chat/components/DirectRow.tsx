"use client";

import Link from "next/link";
import type { Route } from "next";
import { CheckCheck } from "lucide-react";
import type { Conversation } from "../types";
import { ChatAvatar } from "./ChatAvatar";
import { AccountBadges } from "@/components/shared/AccountBadges";

/** A direct conversation as a selectable row of the two-pane conversations list. */
export function DirectRow({ conversation, selected }: { conversation: Conversation; selected: boolean }) {
  const { participant } = conversation;
  const unread = conversation.unreadCount;
  return (
    <Link className={`wg dg ${selected ? "on" : ""}`} href={`/chat/${conversation.id}` as Route} aria-current={selected ? "page" : undefined}>
      <ChatAvatar participant={participant} className="h-11 w-11 shadow-inset" textClassName="text-base" />
      <span className="wg-main">
        <b>
          <span className="wk-title">{participant.name}</span>
          <AccountBadges verified={participant.isVerified} speaker={participant.isSpeaker} official={participant.isOfficial} kind={participant.profileType} size="md" />
        </b>
        <span className="last">
          {unread === 0 ? <CheckCheck className="ml-1 inline h-3.5 w-3.5 text-verified" /> : null}
          {conversation.preview}
        </span>
      </span>
      <span className="wg-side">
        <span>{conversation.updatedAt}</span>
        <span className="badges">{unread > 0 ? <span className="unread num">{unread > 99 ? "۹۹+" : unread.toLocaleString("fa-IR")}</span> : null}</span>
      </span>
    </Link>
  );
}
