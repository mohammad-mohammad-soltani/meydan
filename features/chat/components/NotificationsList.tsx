import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { AtSign, Bell, Heart, MessageCircle, Newspaper, Repeat2, UserPlus, Users } from "lucide-react";
import type { ChatNotification, ChatNotificationKind } from "../types";

const icons: Record<ChatNotificationKind, typeof Heart> = {
  like: Heart,
  repost: Repeat2,
  media: Newspaper,
  mention: AtSign,
  follow: UserPlus,
  comment: MessageCircle,
  initiative: Users,
  system: Bell,
};

const tones: Record<ChatNotificationKind, string> = {
  like: "bg-danger-surface text-danger",
  repost: "bg-success-surface text-success",
  media: "bg-info-surface text-info",
  mention: "bg-warning-surface text-warning",
  follow: "bg-accent-surface text-accent",
  comment: "bg-info-surface text-info",
  initiative: "bg-success-surface text-success",
  system: "bg-muted text-foreground-secondary",
};

export function NotificationsList({
  notifications,
  onRead,
}: {
  notifications: ChatNotification[];
  onRead?: (notificationId: string) => void | Promise<void>;
}) {
  if (!notifications.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-card border border-dashed border-border px-4 text-center text-sm text-foreground-secondary">
        هنوز اعلانی ندارید
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const Icon = icons[notification.kind];
        const markRead = () => {
          if (notification.unread) void onRead?.(notification.id);
        };
        const content = (
          <article className={`relative flex gap-3 rounded-card border p-3 text-right transition-colors hover:bg-hover ${notification.unread ? "border-ring/40 bg-hover/40" : "border-border bg-card"}`}>
            <div className="relative shrink-0">
              {notification.actor?.avatarUrl ? (
                <Image src={notification.actor.avatarUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-xs font-black text-foreground">
                  {notification.actor?.avatarLabel ?? <Icon className="h-5 w-5" aria-hidden="true" />}
                </div>
              )}
              <span className={`absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-card ${tones[notification.kind]}`}>
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xs font-bold leading-5 text-foreground">{notification.title}</h2>
                <div className="flex shrink-0 items-center gap-2">
                  {notification.unread ? <span className="h-2 w-2 rounded-full bg-danger" aria-label="خوانده نشده" /> : null}
                  <time className="text-[9px] text-foreground-subtle">{notification.createdAt}</time>
                </div>
              </div>
              {notification.description ? <p className="text-[11px] leading-5 text-foreground-secondary">{notification.description}</p> : null}
            </div>
          </article>
        );

        if (notification.targetUrl) {
          return (
            <Link
              key={notification.id}
              href={notification.targetUrl as Route}
              onClick={markRead}
              className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={notification.id}
            type="button"
            onClick={markRead}
            className="block w-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
