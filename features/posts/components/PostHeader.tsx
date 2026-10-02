"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostAuthor } from "../types";
import { AccountBadges } from "@/components/shared/AccountBadges";

type PostHeaderProps = { timeAgo: string };

export function PostHeader({ timeAgo }: PostHeaderProps) {
  const router = useRouter();
  /**
   * `history.length > 1` says nothing about where back actually lands: an
   * overlay that pushed an entry of its own (the video feed does) leaves the
   * reader on this very URL, faded out by the exit animation and apparently
   * stuck. Go back, then check that the route really changed.
   */
  const handleBack = () => {
    const view = document.getElementById("view-full-post");
    const from = window.location.pathname;
    view?.classList.add("ui-exit");
    window.setTimeout(() => {
      router.back();
      window.setTimeout(() => {
        if (window.location.pathname !== from) return;
        view?.classList.remove("ui-exit");
        router.push("/home");
      }, 320);
    }, 180);
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-border bg-surface-glass px-4 py-2 shadow-xs backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2"><Link href="/home" onClick={(event) => { event.preventDefault(); handleBack(); }} aria-label="بازگشت به خانه" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"><ArrowRight className="h-5 w-5" /></Link><span className="truncate text-sm font-bold text-foreground">رویداد</span></div>
      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
    </header>
  );
}

export function PostAuthorInfo({ author, badge }: { author: PostAuthor; badge: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-black text-icon" aria-hidden="true">{author.initials}</span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1"><strong className="truncate text-sm text-foreground">{author.name}</strong><AccountBadges verified={author.verified} speaker={author.verifiedSpeaker} official={author.verifiedOfficial} kind={author.type} size="md" /></div>
        <span className="shrink-0 rounded-md bg-brand-muted px-2 py-1 text-[10px] font-bold text-brand">{badge}</span>
      </div>
    </div>
  );
}
