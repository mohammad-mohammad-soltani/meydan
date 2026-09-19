"use client";

import { ArrowRight, BadgeCheck, Bell, BellOff, MoreVertical, Search, UserRound } from "lucide-react";
import { useState } from "react";
import type { Conversation } from "../types";
import { ChatAvatar } from "./ChatAvatar";
import { OfficialBadge } from "@/components/shared/OfficialBadge";

type ChatHeaderProps = {
  conversation: Conversation;
  isLeaving: boolean;
  onBack: () => void;
  onOpenInfo: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onToggleMute: () => void;
};

const menuItemClass = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-hover";

export function ChatHeader({ conversation, isLeaving, onBack, onOpenInfo, onOpenProfile, onOpenSearch, onToggleMute }: ChatHeaderProps) {
  const { participant } = conversation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const run = (callback: () => void) => { closeMenu(); callback(); };

  return (
    <header className="relative z-30 flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-surface-glass px-3 shadow-xs backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-1">
        <button type="button" onClick={onBack} disabled={isLeaving} aria-label="بازگشت به گفتگوها" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:text-disabled-foreground"><ArrowRight className="h-6 w-6" /></button>
        <button type="button" onClick={onOpenInfo} className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-right hover:bg-hover" aria-label={`اطلاعات ${participant.name}`}>
          <ChatAvatar participant={participant} className="h-[42px] w-[42px]" textClassName="text-sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1"><h1 className="truncate text-[15px] font-extrabold text-foreground">{participant.name}</h1>{participant.isVerified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-verified text-on-solid" aria-label="تأییدشده" /> : null}<OfficialBadge official={participant.isOfficial} /></div>
            <p className={`truncate text-[11px] ${participant.isOnline ? "text-verified" : "text-muted-foreground"}`}>{participant.isOnline ? "آنلاین" : "آخرین بازدید اخیراً"}</p>
          </div>
        </button>
      </div>

      <div className="relative shrink-0">
        {isMenuOpen ? <button type="button" tabIndex={-1} aria-label="بستن منو" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" /> : null}
        <button type="button" aria-label="گزینه‌های بیشتر" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} className="relative z-40 grid h-10 w-10 place-items-center rounded-full text-icon transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MoreVertical className="h-5 w-5" /></button>
        <div role="menu" aria-hidden={!isMenuOpen} className={`absolute left-0 top-11 z-40 w-56 origin-top-left overflow-hidden rounded-panel border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-popover backdrop-blur-xl transition duration-200 ease-out ${isMenuOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none -translate-y-1 scale-95 opacity-0"}`}>
          <button type="button" role="menuitem" onClick={() => run(onOpenProfile)} className={menuItemClass}><UserRound className="h-4.5 w-4.5" /><span>مشاهدهٔ پروفایل</span></button>
          <button type="button" role="menuitem" onClick={() => run(onOpenSearch)} className={menuItemClass}><Search className="h-4.5 w-4.5" /><span>جستجو در گفتگو</span></button>
          <button type="button" role="menuitem" onClick={() => run(onToggleMute)} className={menuItemClass}>{conversation.notificationsMuted ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}<span>{conversation.notificationsMuted ? "فعال کردن اعلان‌ها" : "بی‌صدا کردن اعلان‌ها"}</span></button>
        </div>
      </div>
    </header>
  );
}
