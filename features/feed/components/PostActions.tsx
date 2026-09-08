import Link from "next/link";
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
};

const formatCount = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(value);

export function PostActions({ postId, likes, comments, reposts, liked, reposted, onLike, onRepost, onShare }: PostActionsProps) {
  return (
    <div className="mt-4 flex items-center justify-around border-t border-slate-100 pt-3 text-slate-400 dark:border-slate-800 dark:text-slate-500">
      <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری روایت" className="transition hover:text-brand-red"><Share2 className="h-5 w-5" /></button>
      <Link href={"/posts/" + postId} aria-label="مشاهده نظرها" className="inline-flex items-center gap-1 transition hover:text-brand-red"><MessageCircle className="h-5 w-5" /><span className="text-xs">{comments}</span></Link>
      <button type="button" onClick={onRepost} aria-pressed={reposted} className={"inline-flex items-center gap-1 transition " + (reposted ? "text-emerald-500" : "hover:text-emerald-500")}><Repeat2 className="h-5 w-5" /><span className="text-xs">{reposts}</span></button>
      <button type="button" onClick={onLike} aria-pressed={liked} className={"inline-flex items-center gap-1 transition " + (liked ? "text-brand-red" : "hover:text-brand-red")}><Heart className={"h-5 w-5 " + (liked ? "fill-current" : "")} /><span className="text-xs">{formatCount(likes + (liked ? 1 : 0))}</span></button>
    </div>
  );
}