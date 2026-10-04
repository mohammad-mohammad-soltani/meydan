"use client";

import { Bell, BellOff, ChevronRight, MoreVertical, Phone, Search, UserRound, Video } from "lucide-react";
import { useState } from "react";
import type { Conversation } from "../types";
import { ChatAvatar } from "./ChatAvatar";
import { AccountBadges } from "@/components/shared/AccountBadges";

type ChatHeaderProps = {
  conversation: Conversation;
  isLeaving: boolean;
  onBack: () => void;
  onOpenInfo: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  onToggleMute: () => void;
  /** Two-pane layout: the list is always visible beside the room, so the back arrow is mobile-only. */
  embedded?: boolean;
};

const menuItemClass = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-hover";

export function ChatHeader({ conversation, isLeaving, onBack, onOpenInfo, onOpenProfile, onOpenSearch, onToggleMute, embedded = false }: ChatHeaderProps) {
  const { participant } = conversation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const run = (callback: () => void) => { closeMenu(); callback(); };

  return (
    <header className="relative z-30 flex h-[67px] shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onBack} disabled={isLeaving} aria-label="بازگشت به گفتگوها" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-foreground transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:text-disabled-foreground ${embedded ? "min-[1024px]:hidden" : ""}`}><ChevronRight className="h-5 w-5" /></button>
        <button type="button" onClick={onOpenInfo} className="flex min-w-0 items-center gap-3 rounded-xl py-1 text-right hover:bg-hover" aria-label={`اطلاعات ${participant.name}`}>
          <ChatAvatar participant={participant} className="h-[42px] w-[42px]" textClassName="text-sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1"><h1 className="truncate text-[15.5px] font-bold text-foreground">{participant.name}</h1><AccountBadges verified={participant.isVerified} speaker={participant.isSpeaker} official={participant.isOfficial} kind={participant.profileType} /></div>
            <p className="truncate text-xs text-muted-foreground">{participant.isOnline === true ? "آنلاین" : participant.handle ? `@${participant.handle}` : ""}</p>
          </div>
        </button>
      </div>

      <div className="relative flex shrink-0 items-center text-muted-foreground">
        <button type="button" aria-label="جستجو در گفتگو" onClick={onOpenSearch} className="grid h-[38px] w-[38px] place-items-center rounded-full transition-colors hover:bg-hover hover:text-foreground"><Search className="h-5 w-5" /></button>
        {/* Calls are in the reference but have no backend yet. */}
        <button type="button" disabled title="به‌زودی" aria-label="تماس صوتی (به‌زودی)" className="grid h-[38px] w-[38px] cursor-default place-items-center rounded-full"><Phone className="h-5 w-5" /></button>
        <button type="button" disabled title="به‌زودی" aria-label="تماس تصویری (به‌زودی)" className="grid h-[38px] w-[38px] cursor-default place-items-center rounded-full"><Video className="h-5 w-5" /></button>
        {isMenuOpen ? <button type="button" tabIndex={-1} aria-label="بستن منو" onClick={closeMenu} className="fixed inset-0 z-30 cursor-default" /> : null}
        <button type="button" aria-label="گزینه‌های بیشتر" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} className="relative z-40 grid h-[38px] w-[38px] place-items-center rounded-full transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MoreVertical className="h-5 w-5" /></button>
        <div role="menu" aria-hidden={!isMenuOpen} className={`absolute left-0 top-11 z-40 w-56 origin-top-left overflow-hidden rounded-panel border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-popover backdrop-blur-xl transition duration-200 ease-out ${isMenuOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none -translate-y-1 scale-95 opacity-0"}`}>
          <button type="button" role="menuitem" onClick={() => run(onOpenProfile)} className={menuItemClass}><UserRound className="h-4.5 w-4.5" /><span>مشاهدهٔ پروفایل</span></button>
          <button type="button" role="menuitem" onClick={() => run(onOpenSearch)} className={menuItemClass}><Search className="h-4.5 w-4.5" /><span>جستجو در گفتگو</span></button>
          <button type="button" role="menuitem" onClick={() => run(onToggleMute)} className={menuItemClass}>{conversation.notificationsMuted ? <Bell className="h-4.5 w-4.5" /> : <BellOff className="h-4.5 w-4.5" />}<span>{conversation.notificationsMuted ? "فعال کردن اعلان‌ها" : "بی‌صدا کردن اعلان‌ها"}</span></button>
        </div>
      </div>
    </header>
  );
}
