import { chatAvatar } from "@/components/shared/generated-media";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Conversation } from "../types";

type ConversationItemProps = {
  conversation: Conversation;
};

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { participant } = conversation;
  return (
    <Link href={"/chat/" + conversation.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 dark:border-slate-800 dark:hover:bg-slate-900/60">
      <div className="flex min-w-0 items-center gap-3">
        <img src={chatAvatar(participant.avatarTone)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
            <span className="truncate">{participant.name}</span>
            {participant.isVerified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-blue-500 text-blue-500" aria-label="تأییدشده" /> : null}
          </div>
          <p className="mt-1 max-w-[14rem] truncate text-[10px] text-slate-500 dark:text-slate-400">{conversation.preview}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-[9px] text-slate-400">
        <span>{conversation.updatedAt}</span>
        {conversation.unreadCount > 0 ? <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">{conversation.unreadCount}</span> : null}
      </div>
    </Link>
  );
}
