"use client";

import styles from "../reference.module.css";

import { UserCheck, UserPlus } from "lucide-react";

/** The small «دنبال کردن» pill in a post header. */
export function FollowPill({ following, onToggle }: { following: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      dir="ltr"
      aria-pressed={following}
      onClick={(event) => {
        // The timeline card is wrapped in a link.
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={`${styles.follow} pointer-events-auto relative z-10 flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
        following ? "border-transparent bg-surface-elevated text-muted-foreground" : "border-border bg-surface-muted text-foreground hover:bg-hover"
      }`}
    >
      {following ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <UserPlus aria-hidden="true" className="h-3.5 w-3.5" />}
      {following ? "دنبال شد" : "دنبال کردن"}
    </button>
  );
}
