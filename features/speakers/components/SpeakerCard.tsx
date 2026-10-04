import Link from "next/link";
import type { Route } from "next";

import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { publicProfileHref } from "@/lib/profile-route";
import { hueOf } from "@/lib/relative-fa";
import { SpeakerInviteButton } from "@/features/speaker-invitations/components/SpeakerInviteButton";
import type { Speaker } from "../types";

export function SpeakerCard({
  speaker,
  canInvite = false,
  venue = "",
}: {
  speaker: Speaker;
  canInvite?: boolean;
  venue?: string;
}) {
  const profileHref = speaker.userId
    ? (publicProfileHref("user", speaker.userId, speaker.handle) as Route)
    : null;

  const letter =
    speaker.initials.trim().slice(0, 1) ||
    speaker.name.trim().slice(0, 1) ||
    "؟";

  const avatar = speaker.avatarUrl ? (
    <OptimizedAvatar
      src={speaker.avatarUrl}
      alt=""
      width={50}
      height={50}
      className="h-[50px] w-[50px] rounded-full object-cover ring-2 ring-brand-muted"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-[50px] w-[50px] place-items-center rounded-full text-[14.5px] font-extrabold"
      style={{ background: `hsl(${hueOf(speaker.name)} 88% 82%)`, color: `hsl(${hueOf(speaker.name)} 50% 27%)` }}
    >
      {letter}
    </span>
  );

  return (
    <article
      dir="rtl"
      className="reference-speaker-row ui-enter flex w-full items-center justify-between gap-3 border-t border-divider px-4 py-3"
    >
      {/* Avatar + Name + Speaker verification */}
      <div className="flex min-w-0 items-center gap-3">
        {profileHref ? (
          <Link
            href={profileHref}
            aria-label={`نمایه ${speaker.name}`}
            className="shrink-0"
          >
            {avatar}
          </Link>
        ) : (
          <div className="shrink-0">{avatar}</div>
        )}

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            {profileHref ? (
              <Link href={profileHref} className="truncate text-[14.5px] font-extrabold text-foreground transition-colors hover:text-brand">
                {speaker.name}
              </Link>
            ) : (
              <span className="truncate text-[14.5px] font-extrabold text-foreground">{speaker.name}</span>
            )}
            <SpeakerBadge verified={speaker.verified} size="md" />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[speaker.categories[0]?.name, speaker.cities[0]].filter(Boolean).join(" · ") || speaker.expertise}
          </p>
        </div>
      </div>

      {/* Invite button */}
      <div className="shrink-0">
        <SpeakerInviteButton
          speaker={{
            userId: speaker.userId,
            name: speaker.name,
            avatarUrl: speaker.avatarUrl,
            expertise: speaker.expertise,
            categories: speaker.categories,
            verifiedSpeaker: speaker.verified,
          }}
          canInvite={canInvite}
          venue={venue}
        />
      </div>
    </article>
  );
}
