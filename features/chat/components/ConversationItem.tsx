"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { chatAvatar } from "@/components/shared/generated-media";
import type { Route } from "next";
import { BadgeCheck, CheckCheck } from "lucide-react";
import type { Conversation } from "../types";

type ConversationItemProps = {
  conversation: Conversation;
};

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { participant } = conversation;
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const href = ("/chat/" + conversation.id) as Route;
  const tones = { red: "from-rose-500 to-orange-400", amber: "from-amber-400 to-orange-500", blue: "from-sky-400 to-blue-600", emerald: "from-emerald-400 to-teal-600", violet: "from-violet-400 to-indigo-600", slate: "from-slate-500 to-slate-800" };
  const openConversation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || isOpening) return;
    event.preventDefault();
    setIsOpening(true);
    window.setTimeout(() => router.push(href), 180);
  };
  return (
    <Link href={href} onClick={openConversation} aria-busy={isOpening} className={"group flex min-h-[72px] items-center gap-3 px-4 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9edb] dark:hover:bg-white/[.035] " + (isOpening ? "conversation-item-opening" : "")}>
      <Image src={chatAvatar(participant.avatarTone)} alt="" width={54} height={54} className={`h-[54px] w-[54px] shrink-0 rounded-full object-cover shadow-inner ${tones[participant.avatarTone]}`} />
      <div className="min-w-0 flex-1 self-stretch border-b border-slate-100 py-2 dark:border-white/[.08]">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[15px] font-bold leading-5 text-slate-900 dark:text-white">{participant.name}</span>
            {participant.isVerified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-[#5c9edb] text-white" aria-label="تأییدشده" /> : null}
          </div>
          <span className="shrink-0 text-[11px] leading-5 text-slate-400 dark:text-slate-500">{conversation.updatedAt}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] leading-5 text-slate-500 dark:text-slate-400">{conversation.unreadCount === 0 ? <CheckCheck className="ml-1 inline h-3.5 w-3.5 text-[#5c9edb]" /> : null}{conversation.preview}</p>
          {conversation.unreadCount > 0 ? <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#6f8090] px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? "۹۹+" : conversation.unreadCount}</span> : null}
        </div>
      </div>
    </Link>
  );
}
