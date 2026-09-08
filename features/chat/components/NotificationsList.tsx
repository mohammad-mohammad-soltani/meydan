import Link from "next/link";
import { AtSign, Heart, MessageSquare, Newspaper, Repeat2, UserPlus } from "lucide-react";
import type { ChatNotification, ChatNotificationKind } from "../types";

const icons: Record<ChatNotificationKind, typeof Heart> = {
  like: Heart,
  repost: Repeat2,
  message: MessageSquare,
  media: Newspaper,
  mention: AtSign,
  follow: UserPlus,
};

const tones: Record<ChatNotificationKind, string> = {
  like: "bg-red-500/10 text-brand-red",
  repost: "bg-emerald-500/10 text-emerald-500",
  message: "bg-purple-500/10 text-purple-500",
  media: "bg-blue-500/10 text-blue-500",
  mention: "bg-amber-500/10 text-amber-500",
  follow: "bg-indigo-500/10 text-indigo-500",
};

export function NotificationsList({ notifications }: { notifications: ChatNotification[] }) {
  return <div className="space-y-2.5">{notifications.map((notification) => {
    const Icon = icons[notification.kind];
    const content = <article className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40"><div className={"shrink-0 rounded-xl p-2 " + tones[notification.kind]}><Icon className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0 flex-1 space-y-1"><div className="flex items-center justify-between gap-2"><h2 className="text-xs font-bold text-slate-900 dark:text-white">{notification.title}</h2><time className="shrink-0 text-[9px] text-slate-400">{notification.createdAt}</time></div><p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{notification.description}</p></div></article>;
    return notification.conversationId ? <Link key={notification.id} href={"/chat/" + notification.conversationId} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40">{content}</Link> : <div key={notification.id}>{content}</div>;
  })}</div>;
}
