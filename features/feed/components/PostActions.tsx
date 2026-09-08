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

export function PostActions({ postId, likes, comments, reposts, liked, reposted, onLike, onRepost, onShare, className = "" }: PostActionsProps) {
  return (
    <div dir="ltr" className={"feed-post-actions pointer-events-auto relative z-20 mt-3 grid h-10 grid-cols-4 items-center rounded-2xl border border-slate-200 bg-white/70 px-1 text-slate-400 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500 dark:shadow-none " + className}>
      <button type="button" onClick={(event) => { event.stopPropagation(); onShare(); }} aria-label="اشتراک‌گذاری روایت" className="pointer-events-auto grid h-8 w-full place-items-center rounded-full transition-colors hover:bg-blue-500/10 hover:text-blue-500"><Share2 className="h-[17px] w-[17px]" /></button>
      <Link scroll={false} onClick={(event) => { event.stopPropagation(); if (window.location.pathname === "/posts/" + postId) { event.preventDefault(); window.history.replaceState(null, "", "/posts/" + postId + "#comment-composer"); document.getElementById("comment-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }); } }} href={("/posts/" + postId + "#comment-composer") as Route} aria-label="مشاهده نظرها" className="pointer-events-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-full transition-colors hover:bg-blue-500/10 hover:text-blue-500"><MessageCircle className="h-[17px] w-[17px]" /><span className="text-xs">{comments}</span></Link>
      <button type="button" onClick={(event) => { event.stopPropagation(); onRepost(); }} aria-label="بازنشر روایت" aria-pressed={reposted} className={"pointer-events-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-full transition-colors hover:bg-emerald-500/10 " + (reposted ? "text-emerald-500" : "hover:text-emerald-500")}><Repeat2 className="h-[17px] w-[17px]" /><span className="text-xs">{reposts + (reposted ? 1 : 0)}</span></button>
      <button type="button" onClick={(event) => { event.stopPropagation(); onLike(); }} aria-label="پسندیدن روایت" aria-pressed={liked} className={"pointer-events-auto inline-flex h-8 w-full items-center justify-center gap-1 rounded-full transition-colors hover:bg-brand-red/10 " + (liked ? "text-brand-red" : "hover:text-brand-red")}><Heart className={"h-[17px] w-[17px] " + (liked ? "fill-current" : "")} /><span className="text-xs">{formatCount(likes + (liked ? 1 : 0))}</span></button>
    </div>
  );
}
