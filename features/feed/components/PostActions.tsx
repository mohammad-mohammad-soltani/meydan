"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Eye, Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { quoteComposeHref } from "../post-counts";
import { RepostMenu } from "./RepostMenu";
import { BookmarkButton } from "./BookmarkButton";

type PostActionsProps = {
  postId: string;
  likes: number;
  /** Reposts plus quotes. */
  reposts: number;
  comments: number;
  views: number;
  liked: boolean;
  reposted: boolean;
  onLike: () => void;
  onRepost: () => void;
  /** Shows the «اشتراک» control at the end of the pill. */
  onShare?: () => void;
  /** Saved state from the post; the bookmark button shows when it is given. */
  bookmarked?: boolean;
  className?: string;
};

const formatCount = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(value);
const actionBase = "pointer-events-auto inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-1.5 text-xs transition-colors";

/** The reference design's single rounded bar: like, repost, views, comments, share. */
export function PostActions({ postId, likes, reposts, comments, views, liked, reposted, onLike, onRepost, onShare, bookmarked, className = "" }: PostActionsProps) {
  const { requireAuth } = useAuthGate();
  const router = useRouter();

  return (
    <div dir="rtl" className={`feed-post-actions pointer-events-auto relative z-20 mt-4 flex items-center justify-between rounded-full border border-border-strong bg-surface-muted px-4 py-1.5 text-foreground-secondary ${className}`}>
      <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (!requireAuth()) return; onLike(); }} aria-label="پسندیدن روایت" aria-pressed={liked} className={`${actionBase} ${liked ? "text-brand" : "hover:text-brand"}`}>
        <Heart className={`h-[17px] w-[17px] ${liked ? "fill-current" : ""}`} /><span>{formatCount(likes)}</span>
      </button>
      <RepostMenu
        reposted={reposted}
        onRepost={onRepost}
        onQuote={() => router.push(quoteComposeHref(postId) as Route)}
        className={`${actionBase} ${reposted ? "text-success" : "hover:text-success"}`}
      >
        <Repeat2 className="h-[18px] w-[18px]" /><span>{formatCount(reposts)}</span>
      </RepostMenu>
      <span aria-label={`${views} بازدید`} className={actionBase}>
        <Eye className="h-[17px] w-[17px]" /><span>{formatCount(views)}</span>
      </span>
      <Link
        scroll={false}
        onClick={(event) => {
          event.stopPropagation();
          if (window.location.pathname === "/posts/" + postId) {
            event.preventDefault();
            window.history.replaceState(null, "", "/posts/" + postId + "#comment-composer");
            document.getElementById("comment-composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        href={("/posts/" + postId + "#comment-composer") as Route}
        aria-label="مشاهده نظرها"
        className={`${actionBase} hover:text-info`}
      >
        <MessageCircle className="h-[17px] w-[17px]" /><span>{formatCount(comments)}</span>
      </Link>
      {onShare ? (
        <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onShare(); }} aria-label="اشتراک‌گذاری روایت" className={`${actionBase} font-bold hover:text-foreground`}>
          <Share2 className="h-4 w-4" /><span>اشتراک</span>
        </button>
      ) : null}
      {bookmarked !== undefined ? <BookmarkButton postId={postId} bookmarked={bookmarked} /> : null}
    </div>
  );
}
