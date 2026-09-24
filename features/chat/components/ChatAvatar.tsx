"use client";

import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { ChatUser } from "../types";

const toneClasses: Record<ChatUser["avatarTone"], string> = {
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
      className={`grid shrink-0 place-items-center rounded-full font-black ${toneClasses[participant.avatarTone]} ${className} ${textClassName}`}
    >
      {initial}
    </span>
  );
}
