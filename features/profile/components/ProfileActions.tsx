import Link from "next/link";
import { Mail, Settings2 } from "lucide-react";

type ProfileActionsProps = { isFollowing: boolean; onToggleFollowing: () => void; onOpenManagement: () => void; };

export function ProfileActions({ isFollowing, onToggleFollowing, onOpenManagement }: ProfileActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-1">
      <Link href="/chat/tehran-enghelab" aria-label="ارسال پیام" className="grid h-9 w-9 place-items-center rounded-full border border-border text-icon transition-colors hover:border-brand-border hover:bg-brand-muted hover:text-brand"><Mail className="h-4 w-4" /></Link>
      <button type="button" onClick={onToggleFollowing} className={`rounded-pill px-4 py-1.5 text-xs font-bold shadow-xs transition-colors ${isFollowing ? "bg-surface-muted text-foreground-secondary hover:bg-hover" : "bg-solid-dark text-on-solid hover:opacity-90 dark:bg-solid-light dark:text-on-light"}`}>{isFollowing ? "دنبال‌شده" : "دنبال کردن"}</button>
      <button type="button" onClick={onOpenManagement} className="inline-flex items-center gap-1 rounded-pill bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground transition-colors hover:bg-brand-hover"><Settings2 className="h-3.5 w-3.5" />مدیریت میدان</button>
    </div>
  );
}
