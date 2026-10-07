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
    speaker.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("\u200c") || "؟";
  const hue = hueOf(speaker.name);

  const avatar = speaker.avatarUrl ? (
    <OptimizedAvatar
      src={speaker.avatarUrl}
      alt=""
      width={50}
      height={50}
      className="h-[50px] w-[50px] rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-[50px] w-[50px] place-items-center rounded-full text-base font-extrabold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 42%), hsl(${hue + 40} 55% 28%))` }}
    >
      {letter}
    </span>
  );

  return (
    <article
      dir="rtl"
      className="reference-speaker-row flex w-full items-center justify-between gap-3 border-t border-[var(--m-line)] px-4 py-3"
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
            <SpeakerBadge verified={speaker.verified} size="md" tone="neutral" />
          </div>
          <p className="mt-[3px] truncate text-xs text-[var(--m-mu)]">
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
          tone="ghost"
          showIcon={false}
        />
      </div>
    </article>
  );
}
