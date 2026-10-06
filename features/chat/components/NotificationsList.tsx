import Link from "next/link";
import type { Route } from "next";
import { AtSign, BriefcaseBusiness, Bell, Heart, MessageCircle, Newspaper, Quote, Repeat2, UserPlus, Users } from "lucide-react";
import { getNotificationPresentation } from "../chat-utils";
import type { ChatNotification, ChatNotificationKind } from "../types";
import { ChIcon, type ChIconName } from "./ChIcon";

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

/** Kinds the reference draws itself; the rest keep their lucide glyph. */
const ref: Partial<Record<ChatNotificationKind, ChIconName>> = { like: "heart", follow: "add", comment: "chat", mention: "at", system: "star" };

export function NotificationsList({
  notifications,
  onRead,
}: {
  notifications: ChatNotification[];
  onRead?: (notificationId: string) => void | Promise<void>;
}) {
  if (!notifications.length) {
    return (
      <div className="ch-em2">
        <ChIcon name="bell" size={28} />
        <p>هنوز اعلانی ندارید</p>
      </div>
    );
  }

  return (
    <>
      {notifications.map((notification) => {
        const Icon = icons[notification.kind];
        const presentation = getNotificationPresentation(notification);
        const markRead = () => {
          if (notification.unread) void onRead?.(notification.id);
        };
        const content = (
          <>
            <span className="ch-ni" aria-hidden="true" style={{ ["--h" as string]: hues[notification.kind] }}>
              {ref[notification.kind] ? <ChIcon name={ref[notification.kind]!} size={19} /> : <Icon width={19} height={19} strokeWidth={1.9} />}
            </span>
            <span className="ch-nb">
              <span>
                {presentation.actorName && presentation.title.startsWith(presentation.actorName) ? (
                  <><b>{presentation.actorName}</b>{presentation.title.slice(presentation.actorName.length)}</>
                ) : presentation.title}
                {presentation.description ? <>: «{presentation.description}»</> : null}
              </span>
              <time>{notification.createdAt}</time>
            </span>
            {notification.unread ? <i className="ch-dot" aria-label="خوانده نشده" /> : null}
          </>
        );
        const cls = `ch-n${notification.unread ? " u" : ""}`;

        if (presentation.href) {
          return (
            <Link key={notification.id} href={presentation.href as Route} onClick={markRead} className={cls}>
              {content}
            </Link>
          );
        }

        return (
          <button key={notification.id} type="button" onClick={markRead} className={cls}>
            {content}
          </button>
        );
      })}
    </>
  );
}
