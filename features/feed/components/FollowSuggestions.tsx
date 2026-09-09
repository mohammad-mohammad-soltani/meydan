import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { FollowSuggestion } from "../types";

type FollowSuggestionsProps = {
  suggestions: FollowSuggestion[];
  followedIds: Set<string>;
  onToggleFollow: (id: string) => void;
};

export function FollowSuggestions({ suggestions, followedIds, onToggleFollow }: FollowSuggestionsProps) {
  return (
    <section className="space-y-3 px-5 py-6">
      <h1 className="text-base font-black text-foreground">پایگاه‌های پیشنهادی برای دنبال‌کردن</h1>
      {suggestions.map((suggestion) => {
        const followed = followedIds.has(suggestion.id);
        return (
          <article key={suggestion.id} className="rounded-card border border-border bg-card p-4 text-card-foreground shadow-xs">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-xs font-black text-brand-foreground">{suggestion.city.slice(0, 2)}</div>
              <div className="min-w-0 flex-1">
                <Link href="/profile" className="inline-flex items-center gap-1 font-black text-foreground">
                  {suggestion.name}
                  <BadgeCheck className="h-4 w-4 fill-verified text-on-solid" />
                </Link>
                <p dir="ltr" className="mt-1 text-xs text-muted-foreground">@{suggestion.handle}</p>
                <p className="mt-2 text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
              <button type="button" onClick={() => onToggleFollow(suggestion.id)} className={`shrink-0 rounded-control px-3 py-2 text-xs font-black transition-colors ${followed ? "bg-surface-muted text-foreground-secondary hover:bg-hover" : "bg-brand text-brand-foreground hover:bg-brand-hover"}`}>
                {followed ? "دنبال‌شده" : "دنبال‌کردن"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
