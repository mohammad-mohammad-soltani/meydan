import Link from "next/link";
import type { Route } from "next";
import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";

type PostActionsProps = {
  postId: string;
  likes: number;
  comments: number;
  reposts: number;
  liked: boolean;
  reposted: boolean;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  className?: string;
};

const formatCount = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(value);
const actionBase = "pointer-events-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-full transition-colors";

export function PostActions({ postId, likes, comments, reposts, liked, reposted, onLike, onRepost, onShare, className = "" }: PostActionsProps) {
  return (
    <div dir="ltr" className={`feed-post-actions pointer-events-auto relative z-20 mt-3 grid h-10 grid-cols-4 items-center rounded-2xl border border-border bg-surface-glass px-1 text-icon-muted shadow-xs ${className}`}>
      <button type="button" onClick={(event) => { event.stopPropagation(); onShare(); }} aria-label="اشتراک‌گذاری روایت" className={`${actionBase} hover:bg-info-surface hover:text-info`}><Share2 className="h-[17px] w-[17px]" /></button>
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
        className={`${actionBase} hover:bg-info-surface hover:text-info`}
      >
        <MessageCircle className="h-[17px] w-[17px]" /><span className="text-xs">{comments}</span>
      </Link>
      <button type="button" onClick={(event) => { event.stopPropagation(); onRepost(); }} aria-label="بازنشر روایت" aria-pressed={reposted} className={`${actionBase} hover:bg-success-surface ${reposted ? "text-success" : "hover:text-success"}`}>
        <Repeat2 className="h-[17px] w-[17px]" /><span className="text-xs">{reposts + (reposted ? 1 : 0)}</span>
      </button>
      <button type="button" onClick={(event) => { event.stopPropagation(); onLike(); }} aria-label="پسندیدن روایت" aria-pressed={liked} className={`${actionBase} hover:bg-brand-muted ${liked ? "text-brand" : "hover:text-brand"}`}>
        <Heart className={`h-[17px] w-[17px] ${liked ? "fill-current" : ""}`} /><span className="text-xs">{formatCount(likes + (liked ? 1 : 0))}</span>
      </button>
    </div>
  );
}
