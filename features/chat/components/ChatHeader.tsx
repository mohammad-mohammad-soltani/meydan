"use client";

import { chatAvatar } from "@/components/shared/generated-media";
import Image from "next/image";
import { ArrowRight, BadgeCheck, BellOff, MoreVertical, Search, UserRound } from "lucide-react";
import { useState } from "react";
import type { Conversation } from "../types";

type ChatHeaderProps = {
  conversation: Conversation;
  isLeaving: boolean;
  onBack: () => void;
};

export function ChatHeader({ conversation, isLeaving, onBack }: ChatHeaderProps) {
  const { participant } = conversation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="relative z-30 flex h-[62px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/95 px-3 shadow-sm backdrop-blur-md dark:border-white/[.06] dark:bg-[#202c33]/95">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onBack} disabled={isLeaving} aria-label="بازگشت به گفتگوها" className="shrink-0 rounded-full p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6dd] disabled:opacity-50 dark:text-slate-100 dark:hover:bg-white/10"><ArrowRight className="h-6 w-6" /></button>
        <Image src={chatAvatar(participant.avatarTone)} alt="" width={42} height={42} className="h-[42px] w-[42px] shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="flex items-center gap-1"><h1 className="truncate text-[15px] font-extrabold text-slate-900 dark:text-white">{participant.name}</h1>{participant.isVerified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#5c9edb] text-white" aria-label="تأییدشده" /> : null}</div>
          <p className="truncate text-[11px] text-[#5c9edb] dark:text-[#80b8df]">{participant.isOnline ? "آنلاین" : "آخرین بازدید اخیراً"}</p>
        </div>
      </div>

      <div className="relative shrink-0">
        {isMenuOpen ? <button type="button" tabIndex={-1} aria-label="بستن منو" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" /> : null}
        <button type="button" aria-label="گزینه‌های بیشتر" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} className="relative z-40 rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58a6dd] dark:text-slate-100 dark:hover:bg-white/10"><MoreVertical className="h-5 w-5" /></button>
        <div role="menu" aria-hidden={!isMenuOpen} className={"absolute left-0 top-11 z-40 w-52 origin-top-left overflow-hidden rounded-2xl border border-black/[.06] bg-white/95 p-1.5 text-sm text-slate-700 shadow-[0_14px_40px_rgba(15,23,42,.2)] backdrop-blur-xl transition duration-200 ease-out dark:border-white/10 dark:bg-[#23313a]/95 dark:text-slate-100 " + (isMenuOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none -translate-y-1 scale-95 opacity-0")}>
          <button type="button" role="menuitem" onClick={closeMenu} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-slate-100 dark:hover:bg-white/10"><UserRound className="h-4.5 w-4.5" /><span>مشاهدهٔ پروفایل</span></button>
          <button type="button" role="menuitem" onClick={closeMenu} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-slate-100 dark:hover:bg-white/10"><Search className="h-4.5 w-4.5" /><span>جستجو در گفتگو</span></button>
          <button type="button" role="menuitem" onClick={closeMenu} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-slate-100 dark:hover:bg-white/10"><BellOff className="h-4.5 w-4.5" /><span>بی‌صدا کردن اعلان‌ها</span></button>
        </div>
      </div>
    </header>
  );
}
