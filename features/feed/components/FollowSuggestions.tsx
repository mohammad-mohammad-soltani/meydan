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
      <h1 className="text-base font-black text-slate-950 dark:text-white">پایگاه‌های پیشنهادی برای دنبال‌کردن</h1>
      {suggestions.map((suggestion) => {
        const followed = followedIds.has(suggestion.id);
        return <article key={suggestion.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red text-xs font-black text-white">{suggestion.city.slice(0, 2)}</div><div className="min-w-0 flex-1"><Link href="/profile" className="inline-flex items-center gap-1 font-black text-slate-950 dark:text-white">{suggestion.name}<BadgeCheck className="h-4 w-4 fill-blue-500 text-white" /></Link><p dir="ltr" className="mt-1 text-xs text-slate-500">@{suggestion.handle}</p><p className="mt-2 text-xs text-slate-500">{suggestion.description}</p></div><button type="button" onClick={() => onToggleFollow(suggestion.id)} className={"shrink-0 rounded-xl px-3 py-2 text-xs font-black transition " + (followed ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-brand-red text-white")}>{followed ? "دنبال‌شده" : "دنبال‌کردن"}</button></div></article>;
      })}
    </section>
  );
}