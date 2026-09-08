import Link from "next/link";
import { ArrowRight, BadgeCheck, Phone } from "lucide-react";
import type { Conversation } from "../types";

export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const { participant } = conversation;
  const avatarClass = participant.avatarTone === "amber" ? "bg-amber-500 text-slate-950" : "bg-brand-red text-white";

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/chat" aria-label="بازگشت به گفتگوها" className="shrink-0 rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 dark:hover:bg-slate-900"><ArrowRight className="h-5 w-5" /></Link>
        <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold " + avatarClass}>{participant.avatarLabel}</div>
        <div className="min-w-0"><div className="flex items-center gap-1.5"><h1 className="truncate text-sm font-black text-slate-900 dark:text-white">{participant.name}</h1>{participant.isVerified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-blue-500 text-blue-500" aria-label="تأییدشده" /> : null}{participant.isOnline ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="آنلاین" /> : null}</div><p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{participant.handle}{participant.isOnline ? " · آنلاین" : ""}</p></div>
      </div>
      <button type="button" aria-label="تماس صوتی" disabled title="تماس صوتی در نسخهٔ آینده فعال می‌شود." className="shrink-0 rounded-xl p-2 text-slate-400 disabled:cursor-not-allowed"><Phone className="h-4.5 w-4.5" /></button>
    </header>
  );
}
