"use client";

import { AtSign, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { normalizeMentionQuery } from "../mentions";
import type { MentionSuggestion } from "../mentions.service";
import styles from "./mention-popover.module.css";

type Props = {
  items: MentionSuggestion[];
  loading: boolean;
  /** What follows the `@` so far; the matching part of each handle is dimmed. */
  query: string;
  active: number;
  onActive: (index: number) => void;
  onPick: (item: MentionSuggestion) => void;
  style?: CSSProperties;
  className?: string;
  /** Opens upwards (comment bar at the bottom of the screen). */
  up?: boolean;
};

const compact = new Intl.NumberFormat("fa-IR", { notation: "compact" });

/** The `@` picker: followed accounts first, each with avatar, name, handle and a «دنبال می‌کنید» chip. */
export function MentionPopover({ items, loading, query, active, onActive, onPick, style, className = "", up = false }: Props) {
  const typed = normalizeMentionQuery(query).length;
  const heading = query === "" ? "از دنبال‌شده‌های شما" : "نتایج جستجو";

  return (
    <div
      role="listbox"
      aria-label="پیشنهاد کاربر برای اشاره"
      style={style}
      className={`${styles.panel} ${up ? styles.panelUp : ""} z-30 w-[280px] max-w-full overflow-hidden rounded-3xl border border-border bg-surface/95 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-bold text-muted-foreground">
        {query === "" ? <Users aria-hidden="true" className="h-3.5 w-3.5" /> : <AtSign aria-hidden="true" className="h-3.5 w-3.5" />}
        {heading}
      </div>

      {items.length ? (
        <div className="pb-1.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === active}
              // A blur beats a click: keep focus in the textarea so its onBlur doesn't close the list first.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onActive(index)}
              onClick={() => onPick(item)}
              className={`${styles.row} flex w-full items-center gap-3 px-4 py-2 text-right transition-colors ${index === active ? "bg-hover" : ""}`}
            >
              <span className={`${styles.ring} grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-sm font-black text-foreground transition-shadow`}>
                {item.avatar_url ? (
                  <OptimizedAvatar src={item.avatar_url} kind={item.account_type} alt="" width={40} className="h-full w-full object-cover" />
                ) : (
                  (item.display_name || item.handle).charAt(0)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <b className="truncate text-sm font-black text-foreground">{item.display_name || item.handle}</b>
                  <AccountBadges verified={item.verified} kind={item.account_type} size="sm" />
                </span>
                <span dir="ltr" className="latin-digits block truncate text-right text-xs">
                  <span className="text-muted-foreground">@{item.handle.slice(0, typed)}</span>
                  <span className="font-bold text-foreground">{item.handle.slice(typed)}</span>
                </span>
              </span>
              {index === active ? (
                <kbd className="shrink-0 rounded-md border border-border px-1.5 text-[10px] text-muted-foreground">Tab</kbd>
              ) : item.followed ? (
                <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">دنبال می‌کنید</span>
              ) : item.followers > 0 ? (
                <span className="shrink-0 text-[11px] text-muted-foreground">{compact.format(item.followers)} دنبال‌کننده</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : loading ? (
        <div aria-busy="true" className="space-y-2.5 px-4 pb-3.5 pt-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className={`${styles.shimmer} h-10 w-10 shrink-0 rounded-full`} />
              <span className="flex-1 space-y-1.5">
                <span className={`${styles.shimmer} block h-3 w-24 rounded-full`} />
                <span className={`${styles.shimmer} block h-2.5 w-16 rounded-full`} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 pb-4 pt-2 text-center text-xs text-muted-foreground">کاربری با این شناسه پیدا نشد.</p>
      )}
    </div>
  );
}
