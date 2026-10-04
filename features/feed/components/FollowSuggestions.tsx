"use client";

import styles from "../reference.module.css";
import { useHorizontalDrag } from "../hooks/useHorizontalDrag";

import Link from "next/link";
import type { Route } from "next";
import { Check, LoaderCircle, UserRoundPlus } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { actorKey, type ActorType } from "@/lib/meydan-follow";
import { publicProfileHref } from "@/lib/profile-route";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { FollowSuggestion } from "../types";
import { AccountBadges } from "@/components/shared/AccountBadges";

type FollowSuggestionsProps = {
  suggestions: FollowSuggestion[];
  followedActorKeys: Set<string>;
  pendingFollowKeys: Set<string>;
  onToggleFollow: (type: ActorType, id: string) => void;
  title?: string;
  /** `strip`: the in-feed horizontal row of the reference design; `grid`: the empty-state list. */
  variant?: "grid" | "strip";
};

export function FollowSuggestions({ suggestions, followedActorKeys, pendingFollowKeys, onToggleFollow, title = "پیشنهاد برای دنبال‌کردن", variant = "grid" }: FollowSuggestionsProps) {
  const { requireAuth } = useAuthGate();
  const dragHandlers = useHorizontalDrag();
  if (!suggestions.length) return null;

  const number = new Intl.NumberFormat("fa-IR");

  if (variant === "strip") {
    const compact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
    return (
      <section aria-label="پیشنهاد دنبال کردن" className={`${styles.suggestions} border-y border-divider bg-surface-sunken/60 p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface-muted text-foreground">
              <UserRoundPlus className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-black text-foreground">پیشنهاد دنبال کردن</span>
            <span className="truncate text-[10px] font-medium text-muted-foreground">کنشگران و راویان میادین</span>
          </div>
          <Link href={"/explore" as Route} className="shrink-0 text-[11px] font-bold text-foreground hover:underline">مشاهده همه</Link>
        </div>
        <div className={`${styles.suggestionRow} -mx-4 flex snap-x gap-3 overflow-x-auto px-4 no-scrollbar`} {...dragHandlers}>
          {suggestions.map((suggestion) => {
            const key = actorKey(suggestion.actorType, suggestion.id);
            const followed = followedActorKeys.has(key);
            const pending = pendingFollowKeys.has(key);
            const profileHref = publicProfileHref(suggestion.actorType, suggestion.id, suggestion.handle) as Route;
            return (
              <article key={key} className={`${styles.suggestion} flex shrink-0 snap-start flex-col justify-between border border-border bg-surface-muted transition-colors hover:border-border-strong`}>
                <div className={styles.suggestionHead}>
                  <Link href={profileHref} className={`${styles.suggestionIdentity} flex min-w-0 items-center gap-2`} aria-label={`پروفایل ${suggestion.name}`}>
                    <span className={`${styles.suggestionAvatar} grid shrink-0 place-items-center overflow-hidden rounded-full border bg-surface-elevated text-xs font-black text-foreground`}>
                      {suggestion.avatarUrl ? <OptimizedAvatar src={suggestion.avatarUrl} alt="" width={64} className="h-full w-full object-cover" /> : suggestion.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-xs font-bold text-foreground">{suggestion.name}</span>
                        <AccountBadges verified={suggestion.verified} kind={suggestion.actorType} size="sm" />
                      </span>
                      <span className="latin-digits block truncate text-[10px] text-muted-foreground" dir="ltr">@{suggestion.handle}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { if (requireAuth()) onToggleFollow(suggestion.actorType, suggestion.id); }}
                    className={`${styles.suggestionFollow} flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 disabled:cursor-wait disabled:opacity-70 ${followed ? "border border-border bg-surface-elevated text-muted-foreground" : "bg-emphasis text-emphasis-foreground"}`}
                  >
                    {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : followed ? <Check className="h-3.5 w-3.5" /> : <UserRoundPlus className="h-3.5 w-3.5" />}
                    {followed ? "دنبال شد" : "دنبال کردن"}
                  </button>
                </div>
                <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-foreground-secondary">{suggestion.description}</p>
                <div className={`${styles.suggestionFooter} flex items-center justify-between border-t border-divider pt-1.5 text-[10px] text-muted-foreground`}>
                  <span className="truncate">{suggestion.city || "فعال در میدان"}</span>
                  {suggestion.followerCount != null ? (
                    <span className="shrink-0 font-bold">{compact.format(suggestion.followerCount)} دنبال‌کننده</span>
                  ) : suggestion.narrativeCount != null ? (
                    <span className="shrink-0 font-bold">{number.format(suggestion.narrativeCount)} روایت</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 px-3 pb-6 pt-2 sm:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black text-foreground">{title}</h2>
        <Link href={"/explore" as Route} className="text-[11px] font-bold text-brand hover:underline">مشاهده بیشتر</Link>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => {
          const key = actorKey(suggestion.actorType, suggestion.id);
          const followed = followedActorKeys.has(key);
          const pending = pendingFollowKeys.has(key);
          const profileHref = publicProfileHref(suggestion.actorType, suggestion.id, suggestion.handle) as Route;
          const meta = suggestion.followerCount != null
            ? `${number.format(suggestion.followerCount)} دنبال‌کننده`
            : suggestion.narrativeCount != null
              ? `${number.format(suggestion.narrativeCount)} روایت`
              : suggestion.city || "فعال در میدان";

          return (
            <article key={key} className="group min-w-0 overflow-hidden rounded-card border border-border bg-card p-4 text-card-foreground shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-border hover:shadow-sm">
              <div className="flex min-w-0 items-start gap-3">
                <Link href={profileHref} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-muted text-sm font-black text-brand" aria-label={`پروفایل ${suggestion.name}`}>
                  {suggestion.avatarUrl ? <OptimizedAvatar src={suggestion.avatarUrl} alt={suggestion.name} width={48} className="h-full w-full object-cover" /> : suggestion.name.slice(0, 1)}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={profileHref} className="flex max-w-full min-w-0 items-center gap-1 font-black text-foreground hover:text-brand">
                    <span className="min-w-0 truncate">{suggestion.name}</span>
                    <AccountBadges verified={suggestion.verified} kind={suggestion.actorType} size="md" />
                  </Link>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground-secondary">{suggestion.description}</p>
                </div>
              </div>
              <button type="button" disabled={pending} onClick={() => { if (requireAuth()) onToggleFollow(suggestion.actorType, suggestion.id); }} className={`mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-pill border px-3 text-xs font-black transition-colors disabled:cursor-wait disabled:opacity-70 ${followed ? "border-border bg-surface-muted text-foreground-secondary hover:bg-hover" : "border-brand bg-brand text-brand-foreground hover:bg-brand-hover"}`}>
                {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : followed ? <Check className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
                {pending ? "در حال ثبت…" : followed ? "دنبال می‌کنید" : "دنبال کردن"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
