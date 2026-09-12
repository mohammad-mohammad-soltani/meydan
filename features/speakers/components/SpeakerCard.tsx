import Image from "next/image";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import type { Speaker } from "../types";

/**
 * Read-only directory entry. Inviting lives in the speaker-invitations
 * feature, which fills the venue from the square's own profile.
 */
export function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <article className="flex items-start gap-3 border-b border-divider py-4 last:border-b-0">
      {speaker.avatarUrl ? (
        <Image
          src={speaker.avatarUrl}
          alt=""
          width={44}
          height={44}
          unoptimized={speaker.avatarUrl.startsWith("http")}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-icon"
        >
          {speaker.initials.slice(0, 1)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h2 className="truncate text-xs font-black text-foreground">{speaker.name}</h2>
          <SpeakerBadge verified={speaker.verified} />
        </div>

        <p className="mt-1 text-[11px] text-foreground-subtle">
          <span dir="ltr">@{speaker.handle}</span>
          {speaker.cities.length ? ` · ${speaker.cities.join(" / ")}` : ""}
        </p>

        {speaker.expertise ? (
          <p className="mt-1.5 text-[11px] leading-6 text-foreground-secondary">{speaker.expertise}</p>
        ) : null}

        {speaker.categories.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {speaker.categories.map((category) => (
              <li
                key={category.slug}
                className="rounded-pill bg-brand-muted px-2 py-0.5 text-[10px] font-bold text-brand"
              >
                {category.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
