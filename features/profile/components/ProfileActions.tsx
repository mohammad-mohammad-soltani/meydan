import Link from "next/link";
import { Mail, Settings2 } from "lucide-react";

type ProfileActionsProps = { isFollowing: boolean; onToggleFollowing: () => void; onOpenManagement: () => void; };

export function ProfileActions({ isFollowing, onToggleFollowing, onOpenManagement }: ProfileActionsProps) {
  return <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-1"><Link href="/chat/tehran-enghelab" aria-label="ارسال پیام" className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-slate-700 transition hover:border-brand-red hover:text-brand-red dark:border-slate-700 dark:text-slate-200"><Mail className="h-4 w-4" /></Link><button type="button" onClick={onToggleFollowing} className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900">{isFollowing ? "دنبال‌شده" : "دنبال کردن"}</button><button type="button" onClick={onOpenManagement} className="inline-flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold text-white"><Settings2 className="h-3.5 w-3.5" />مدیریت میدان</button></div>;
}