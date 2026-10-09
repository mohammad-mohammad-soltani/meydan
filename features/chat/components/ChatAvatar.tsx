"use client";

import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { ChatUser } from "../types";
import { hueOf } from "@/lib/relative-fa";

// Kept for callers that still pass a tone; the initial uses the name hue.
export const toneClasses: Record<ChatUser["avatarTone"], string> = {
  red: "bg-brand-muted text-brand",
  amber: "bg-warning-surface text-warning",
  blue: "bg-info-surface text-info",
  emerald: "bg-success-surface text-success",
  violet: "bg-accent-surface text-accent",
  slate: "bg-surface-muted text-foreground-secondary",
};

type ChatAvatarProps = {
  participant: ChatUser;
  /** Size and shape classes, e.g. `h-[42px] w-[42px]`. */
  className?: string;
  /** Initial size inside the fallback circle. */
  textClassName?: string;
};

/**
 * One avatar for every chat surface.
 *
 * A missing picture never falls back to a stock illustration: it becomes the
 * participant's initial on their deterministic tone, matching how profiles,
 * comments and notifications already render people without a photo.
 */
export function ChatAvatar({
  participant,
  className = "h-10 w-10",
  textClassName = "text-xs",
}: ChatAvatarProps) {
  if (participant.avatarUrl) {
    return (
      <OptimizedAvatar
        src={participant.avatarUrl}
        kind={participant.profileType}
        alt=""
        width={176}
        height={176}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const initial =
    participant.avatarLabel.trim().slice(0, 1) ||
    participant.name.trim().slice(0, 1) ||
    "م";

  return (
    <span
      aria-hidden="true"
      // The reference's pastel initial: a light tint of the name's hue with a dark letter of the same hue.
      style={{ background: `hsl(${hueOf(participant.name)} 85% 82%)`, color: `hsl(${hueOf(participant.name)} 50% 27%)` }}
      className={`grid shrink-0 place-items-center rounded-full font-extrabold ${className} ${textClassName}`}
    >
      {initial}
    </span>
  );
}
