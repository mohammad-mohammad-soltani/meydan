import Image from "next/image";
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
  if (!notifications.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-card border border-dashed border-border text-sm text-foreground-secondary">
        هنوز اعلان جدیدی ندارید
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const Icon = icons[notification.kind];
        const content = (
          <article className={`relative flex gap-3 rounded-card border bg-card p-3 transition-colors hover:bg-hover ${notification.unread ? "border-ring/40" : "border-border"}`}>
            {notification.actor?.avatarUrl ? (
              <Image src={notification.actor.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-black text-foreground">{notification.actor?.avatarLabel ?? "م"}</div>
            )}
            <div className={`absolute right-10 top-8 grid h-5 w-5 place-items-center rounded-full ${tones[notification.kind]}`}>
              <Icon className="h-3 w-3" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1 pr-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xs font-bold text-foreground">{notification.title}</h2>
                <time className="text-[9px] text-foreground-subtle">{notification.createdAt}</time>
              </div>
              <p className="text-[11px] leading-5 text-foreground-secondary">{notification.description}</p>
              {notification.unread ? <span className="inline-block h-2 w-2 rounded-full bg-danger" aria-label="خوانده نشده" /> : null}
            </div>
          </article>
        );

        return notification.targetUrl ? <Link key={notification.id} href={notification.targetUrl as Route} className="block">{content}</Link> : notification.conversationId ? <Link key={notification.id} href={("/chat/" + notification.conversationId) as Route} className="block">{content}</Link> : <div key={notification.id}>{content}</div>;
      })}
    </div>
  );
}
