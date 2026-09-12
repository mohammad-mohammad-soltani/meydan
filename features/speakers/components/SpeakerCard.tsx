import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, MapPin } from "lucide-react";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import { SpeakerInviteButton } from "@/features/speaker-invitations/components/SpeakerInviteButton";
import type { Speaker } from "../types";

/**
 * Directory entry. The avatar and name link to the speaker's public profile and
 * the invite button opens the shared invitation composer; the venue is filled
 * from the inviting square's own profile.
 */
export function SpeakerCard({
  speaker,
  canInvite = false,
  venue = "",
}: {
  speaker: Speaker;
  canInvite?: boolean;
  venue?: string;
}) {
  const profileHref = speaker.userId ? (`/profile/user/${speaker.userId}` as Route) : null;
  const letter = speaker.initials.trim().slice(0, 1) || speaker.name.trim().slice(0, 1) || "؟";

  const avatar = speaker.avatarUrl ? (
    <Image
      src={speaker.avatarUrl}
      alt=""
      width={52}
      height={52}
      unoptimized={speaker.avatarUrl.startsWith("http")}
      className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-muted"
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 place-items-center rounded-full bg-brand-muted text-sm font-black text-brand ring-1 ring-brand-border"
    >
      {letter}
    </span>
  );

  return (
    <article className="ui-enter relative overflow-hidden rounded-card border border-border bg-card shadow-xs transition-colors hover:border-brand-border">
      <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1 bg-brand" />

      <div className="flex items-start gap-3 py-3.5 pl-3.5 pr-4">
        {profileHref ? (
          <Link href={profileHref} aria-label={`نمایه ${speaker.name}`} className="shrink-0">
            {avatar}
          </Link>
        ) : (
          avatar
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="truncate text-sm font-black leading-6 text-foreground transition-colors hover:text-brand"
                  >
                    {speaker.name}
                  </Link>
                ) : (
                  <h2 className="truncate text-sm font-black leading-6 text-foreground">{speaker.name}</h2>
                )}
                <SpeakerBadge verified={speaker.verified} always size="md" />
              </div>

              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground-subtle">
                <span dir="ltr">@{speaker.handle}</span>
                {speaker.cities.length ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
                      <span className="truncate">{speaker.cities.join(" / ")}</span>
                    </span>
                  </>
                ) : null}
              </p>
            </div>

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

          {speaker.expertise ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-6 text-foreground-secondary">{speaker.expertise}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {speaker.categories.map((category) => (
              <span key={category.slug} className="rounded-pill bg-brand-muted px-2 py-0.5 text-[10px] font-bold text-brand">
                {category.name}
              </span>
            ))}

            {profileHref ? (
              <Link
                href={profileHref}
                className="ms-auto inline-flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-[10px] font-black text-brand transition-colors hover:bg-brand-muted"
              >
                مشاهده نمایه
                <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
