import Link from "next/link";
import type { Route } from "next";
import { Compass, LoaderCircle, LogIn, Sparkles, UsersRound } from "lucide-react";
import type { ActorType } from "@/lib/meydan-follow";
import type { FollowSuggestion } from "../types";
import { FollowSuggestions } from "./FollowSuggestions";

type FollowingEmptyStateProps = {
  isLoading: boolean;
  requiresAuth: boolean;
  hasFollowing: boolean;
  suggestions: FollowSuggestion[];
  followedActorKeys: Set<string>;
  pendingFollowKeys: Set<string>;
  onToggleFollow: (type: ActorType, id: string) => void;
};

export function FollowingEmptyState({ isLoading, requiresAuth, hasFollowing, suggestions, followedActorKeys, pendingFollowKeys, onToggleFollow }: FollowingEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="flex min-h-56 items-center justify-center rounded-panel border border-border bg-card text-card-foreground">
          <div className="text-center">
            <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-brand" />
            <p className="mt-3 text-xs font-bold text-muted-foreground">در حال آماده‌کردن دنبال‌شده‌ها…</p>
          </div>
        </div>
      </div>
    );
  }

  if (requiresAuth) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-md rounded-panel border border-border bg-card px-6 py-8 text-center shadow-xs">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-muted text-brand"><UsersRound className="h-7 w-7" /></div>
          <h2 className="mt-4 text-base font-black text-foreground">تایم‌لاین شخصی شما اینجاست</h2>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-muted-foreground">وارد حساب شوید تا روایت‌های آدم‌ها و میدان‌هایی که دنبال می‌کنید فقط در این تب نمایش داده شوند.</p>
          <Link href={"/auth" as Route} className="mx-auto mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-pill bg-brand px-5 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover">
            <LogIn className="h-4 w-4" /> ورود به میدان
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-enter">
      <div className="px-4 py-8">
        <div className="mx-auto max-w-md rounded-panel border border-border bg-card px-6 py-8 text-center shadow-xs">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-muted text-brand">
            {hasFollowing ? <Sparkles className="h-7 w-7" /> : <UsersRound className="h-7 w-7" />}
          </div>
          <h2 className="mt-4 text-base font-black text-foreground">{hasFollowing ? "فعلاً روایت تازه‌ای نیست" : "هنوز کسی را دنبال نکرده‌اید"}</h2>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-muted-foreground">
            {hasFollowing ? "به محض انتشار روایت جدید از دنبال‌شده‌های شما، اینجا نمایش داده می‌شود." : "چند میدان یا نفر را دنبال کنید تا یک تایم‌لاین خلوت و مخصوص خودتان بسازید."}
          </p>
          <Link href={"/explore" as Route} className="mx-auto mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-pill border border-brand-border bg-brand-muted px-5 text-xs font-black text-brand transition-colors hover:bg-hover">
            <Compass className="h-4 w-4" /> کاوش و پیدا کردن
          </Link>
        </div>
      </div>
      {!hasFollowing ? <FollowSuggestions suggestions={suggestions} followedActorKeys={followedActorKeys} pendingFollowKeys={pendingFollowKeys} onToggleFollow={onToggleFollow} title="برای شروع این‌ها را ببینید" /> : null}
    </div>
  );
}
