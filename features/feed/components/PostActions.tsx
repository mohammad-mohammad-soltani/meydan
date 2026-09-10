import Link from "next/link";
import type { Route } from "next";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";

type PostActionsProps = {
  postId: string;
  likes: number;
  comments: number;
  views: number;
  liked: boolean;
  onLike: () => void;
  onShare: () => void;
  className?: string;
};

const formatCount = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(value);
const actionBase = "pointer-events-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-full transition-colors";

export function PostActions({ postId, likes, comments, views, liked, onLike, onShare, className = "" }: PostActionsProps) {
  return (
    <div dir="ltr" className={`feed-post-actions pointer-events-auto relative z-20 mt-3 grid h-9 grid-cols-4 items-center text-icon-muted ${className}`}>
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
        <MessageCircle className="h-[17px] w-[17px]" /><span className="text-xs">{formatCount(comments)}</span>
      </Link>
      <span aria-label={`${views} بازدید`} className={`${actionBase} text-icon-muted`}>
        <Eye className="h-[17px] w-[17px]" /><span className="text-xs">{formatCount(views)}</span>
      </span>
      <button type="button" onClick={(event) => { event.stopPropagation(); onLike(); }} aria-label="پسندیدن روایت" aria-pressed={liked} className={`${actionBase} hover:bg-brand-muted ${liked ? "text-brand" : "hover:text-brand"}`}>
        <Heart className={`h-[17px] w-[17px] ${liked ? "fill-current" : ""}`} /><span className="text-xs">{formatCount(likes + (liked ? 1 : 0))}</span>
      </button>
    </div>
  );
}
