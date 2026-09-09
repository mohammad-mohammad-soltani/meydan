import Link from "next/link";
import type { Route } from "next";
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
  like: "bg-danger-surface text-danger",
  repost: "bg-success-surface text-success",
  message: "bg-accent-surface text-accent",
  media: "bg-info-surface text-info",
  mention: "bg-warning-surface text-warning",
  follow: "bg-accent-surface text-accent",
};

export function NotificationsList({ notifications }: { notifications: ChatNotification[] }) {
  return (
    <div className="space-y-2.5">
      {notifications.map((notification) => {
        const Icon = icons[notification.kind];
        const content = (
          <article className="flex items-start gap-3 rounded-card border border-border bg-card p-3 text-card-foreground transition-colors hover:bg-hover">
            <div className={`shrink-0 rounded-xl p-2 ${tones[notification.kind]}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-bold text-foreground">{notification.title}</h2><time className="shrink-0 text-[9px] text-foreground-subtle">{notification.createdAt}</time></div>
              <p className="text-[11px] leading-relaxed text-foreground-secondary">{notification.description}</p>
            </div>
          </article>
        );
        return notification.conversationId ? <Link key={notification.id} href={("/chat/" + notification.conversationId) as Route} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : <div key={notification.id}>{content}</div>;
      })}
    </div>
  );
}
