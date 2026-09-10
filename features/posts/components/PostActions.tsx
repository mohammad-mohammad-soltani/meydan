import { Heart, MessageCircle, Radio, Repeat2, Share2 } from "lucide-react";

type PostActionsProps = { likes: number; reposts: number; comments: number; liked: boolean; reposted: boolean; isLiveJoined: boolean; onLike: () => void; onRepost: () => void; onShare: () => void; onJoinLive: () => void; };

const formatCount = (value: number) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(value);

export function PostActions({ likes, reposts, comments, liked, reposted, isLiveJoined, onLike, onRepost, onShare, onJoinLive }: PostActionsProps) {
  return (
    <>
      <section className="flex items-center justify-between rounded-card bg-brand p-3 text-brand-foreground shadow-card">
        <div className="flex items-center gap-2"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-foreground opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-brand-foreground" /></span><div className="text-xs"><strong className="block">پخش زنده تجمعات و گفتگوی صوتی فعال است</strong><span className="text-[10px] opacity-80">۸,۲۴۰ نفر هم‌اکنون در اتاق صوتی میدان</span></div></div>
        <button type="button" onClick={onJoinLive} className="inline-flex shrink-0 items-center gap-1 rounded-control bg-solid-light px-3 py-1.5 text-xs font-bold text-brand"><>{isLiveJoined ? "متصل شدید" : <><Radio className="h-3.5 w-3.5" />ورود به لایو</>}</></button>
      </section>
      <div className="mx-0 flex items-center justify-around rounded-card border border-divider bg-card px-3 py-3 text-xs text-muted-foreground shadow-card">
        <button type="button" onClick={onLike} className={`inline-flex flex-row-reverse items-center gap-1 transition-colors hover:text-brand ${liked ? "text-brand" : ""}`}><Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />{formatCount(likes)}</button>
        <button type="button" onClick={onRepost} className={`inline-flex flex-row-reverse items-center gap-1 transition-colors hover:text-success ${reposted ? "text-success" : ""}`}><Repeat2 className="h-4 w-4" />{reposts}</button>
        <span className="inline-flex flex-row-reverse items-center gap-1 text-icon-muted"><MessageCircle className="h-4 w-4" />{comments}</span>
        <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری" className="transition-colors hover:text-warning"><Share2 className="h-4 w-4" /></button>
      </div>
    </>
  );
}
