"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { BadgeCheck, CheckCheck } from "lucide-react";
import type { Conversation } from "../types";
import { participantProfileHref } from "../chat-utils";
import { ChatAvatar } from "./ChatAvatar";
import { OfficialBadge } from "@/components/shared/OfficialBadge";

type ConversationItemProps = { conversation: Conversation };

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { participant } = conversation;
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const href = ("/chat/" + conversation.id) as Route;
  const profileHref = participantProfileHref(participant) as Route;

  const openConversation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || isOpening) return;
    event.preventDefault();
    setIsOpening(true);
    window.setTimeout(() => router.push(href), 180);
  };

  return (
    <div className={`group flex min-h-[72px] items-center gap-3 px-4 py-2 transition hover:bg-hover ${isOpening ? "ui-opening" : ""}`}>
      <Link href={profileHref} aria-label={`نمایه ${participant.name}`} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChatAvatar participant={participant} className="h-[54px] w-[54px] shadow-inset" textClassName="text-lg" />
      </Link>
      <Link href={href} onClick={openConversation} aria-busy={isOpening} className="min-w-0 flex-1 self-stretch border-b border-divider py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[15px] font-bold leading-5 text-foreground">{participant.name}</span>
            {participant.isVerified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" aria-label="تأییدشده" /> : null}
            <OfficialBadge official={participant.isOfficial} />
          </div>
          <span className="shrink-0 text-[11px] leading-5 text-foreground-subtle">{conversation.updatedAt}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] leading-5 text-muted-foreground">{conversation.unreadCount === 0 ? <CheckCheck className="ml-1 inline h-3.5 w-3.5 text-verified" /> : null}{conversation.preview}</p>
          {conversation.unreadCount > 0 ? <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-info px-1.5 text-[10px] font-bold text-on-solid">{conversation.unreadCount > 99 ? "۹۹+" : conversation.unreadCount}</span> : null}
        </div>
      </Link>
    </div>
  );
}
