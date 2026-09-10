import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { BadgeCheck, Check, LoaderCircle, UserRoundPlus } from "lucide-react";
import { actorKey, type ActorType } from "@/lib/meydan-follow";
import type { FollowSuggestion } from "../types";

type FollowSuggestionsProps = {
  suggestions: FollowSuggestion[];
  followedActorKeys: Set<string>;
  pendingFollowKeys: Set<string>;
  onToggleFollow: (type: ActorType, id: string) => void;
  title?: string;
};

export function FollowSuggestions({ suggestions, followedActorKeys, pendingFollowKeys, onToggleFollow, title = "پیشنهاد برای دنبال‌کردن" }: FollowSuggestionsProps) {
  if (!suggestions.length) return null;

  const number = new Intl.NumberFormat("fa-IR");

  return (
    <section className="px-4 pb-6 pt-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-foreground">{title}</h2>
        <Link href={"/explore" as Route} className="text-[11px] font-bold text-brand hover:underline">مشاهده بیشتر</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => {
          const key = actorKey(suggestion.actorType, suggestion.id);
          const followed = followedActorKeys.has(key);
          const pending = pendingFollowKeys.has(key);
          const profileHref = `/profile/${suggestion.actorType}/${suggestion.id}` as Route;
          const meta = suggestion.followerCount != null
            ? `${number.format(suggestion.followerCount)} دنبال‌کننده`
            : suggestion.narrativeCount != null
              ? `${number.format(suggestion.narrativeCount)} روایت`
              : suggestion.city || "فعال در میدان";

          return (
            <article key={key} className="group rounded-card border border-border bg-card p-4 text-card-foreground shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-border hover:shadow-sm">
              <div className="flex items-start gap-3">
                <Link href={profileHref} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-muted text-sm font-black text-brand" aria-label={`پروفایل ${suggestion.name}`}>
                  {suggestion.avatarUrl ? <Image src={suggestion.avatarUrl} alt={suggestion.name} width={48} height={48} unoptimized={suggestion.avatarUrl.startsWith("http")} className="h-full w-full object-cover" /> : suggestion.name.slice(0, 1)}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={profileHref} className="inline-flex max-w-full items-center gap-1 font-black text-foreground hover:text-brand">
                    <span className="truncate">{suggestion.name}</span>
                    {suggestion.verified ? <BadgeCheck aria-label="تأییدشده" className="h-4 w-4 shrink-0 fill-verified text-on-solid" /> : null}
                  </Link>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground-secondary">{suggestion.description}</p>
                </div>
              </div>
              <button type="button" disabled={pending} onClick={() => onToggleFollow(suggestion.actorType, suggestion.id)} className={`mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-pill border px-3 text-xs font-black transition-colors disabled:cursor-wait disabled:opacity-70 ${followed ? "border-border bg-surface-muted text-foreground-secondary hover:bg-hover" : "border-brand bg-brand text-brand-foreground hover:bg-brand-hover"}`}>
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
