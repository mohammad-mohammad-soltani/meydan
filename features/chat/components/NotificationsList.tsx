import Link from "next/link";
import type { Route } from "next";
import { AtSign, BriefcaseBusiness, Bell, Heart, MessageCircle, Newspaper, Quote, Repeat2, UserPlus, Users } from "lucide-react";
import { getNotificationPresentation } from "../chat-utils";
import type { ChatNotification, ChatNotificationKind } from "../types";

const icons: Record<ChatNotificationKind, typeof Heart> = {
  like: Heart,
  repost: Repeat2,
  quote: Quote,
  media: Newspaper,
  mention: AtSign,
  follow: UserPlus,
  comment: MessageCircle,
  initiative: Users,
  work: BriefcaseBusiness,
  system: Bell,
};

/** Hue of each kind's icon circle, as in the reference list. */
const hues: Record<ChatNotificationKind, number> = {
  like: 350,
  repost: 150,
  quote: 150,
  media: 205,
  mention: 35,
  follow: 220,
  comment: 140,
  initiative: 160,
  work: 0,
  system: 330,
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
    <div className="flex flex-col gap-0.5">
      {notifications.map((notification) => {
        const Icon = icons[notification.kind];
        const presentation = getNotificationPresentation(notification);
        const markRead = () => {
          if (notification.unread) void onRead?.(notification.id);
        };
        const content = (
          <article className={`flex items-center gap-3 rounded-[18px] px-3 py-[13px] text-right ${notification.unread ? "bg-foreground/[.07]" : ""}`}>
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{ background: `color-mix(in srgb, hsl(${hues[notification.kind]} 70% 52%) 18%, var(--surface-muted))`, color: `hsl(${hues[notification.kind]} 80% 66%)` }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[5px] text-sm leading-[1.8] text-foreground">
              <p className="line-clamp-3">
                {presentation.actorName && presentation.title.startsWith(presentation.actorName) ? (
                  <><b className="font-bold">{presentation.actorName}</b>{presentation.title.slice(presentation.actorName.length)}</>
                ) : presentation.title}
                {presentation.description ? <>: «{presentation.description}»</> : null}
              </p>
              <time className="text-[11.5px] text-muted-foreground">{notification.createdAt}</time>
            </div>
            {notification.unread ? <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-brand" aria-label="خوانده نشده" /> : null}
          </article>
        );

        if (presentation.href) {
          return (
            <Link
              key={notification.id}
              href={presentation.href as Route}
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
