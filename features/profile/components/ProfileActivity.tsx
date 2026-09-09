import Link from "next/link";
import type { Route } from "next";
import { Heart, MessageCircle, Repeat2, Share2 } from "lucide-react";
import type { ProfileActivity as ProfileActivityModel } from "../types";

type ProfileActivityProps = { activity: ProfileActivityModel; liked: boolean; reposted: boolean; onLike: () => void; onRepost: () => void; };

export function ProfileActivity({ activity, liked, reposted, onLike, onRepost }: ProfileActivityProps) {
  return (
    <section className="space-y-3 px-4">
      <h2 className="text-xs font-bold text-foreground">روایت‌های ثبت‌شده این پایگاه</h2>
      <article className="rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
        <div className="flex justify-between text-[10px] text-foreground-subtle"><span className="inline-flex items-center gap-1 font-bold text-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" />{activity.authorLabel}</span><span>{activity.timeLabel}</span></div>
        <Link href={("/posts/" + activity.id) as Route} className="mt-3 block text-xs leading-7 text-foreground-secondary transition-colors hover:text-brand">«{activity.content}»</Link>
        <div className="mt-3 grid grid-cols-3 gap-1">{activity.tags.map((tag) => <span key={tag} className="rounded bg-surface-muted p-1.5 text-center text-[9px] text-foreground-secondary">{tag}</span>)}</div>
        <div className="mt-3 flex items-center justify-between border-t border-divider pt-2 text-xs text-icon-muted">
          <button type="button" onClick={onLike} className={`inline-flex items-center gap-1 hover:text-brand ${liked ? "text-brand" : ""}`}><Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />{activity.likes + (liked ? 1 : 0)}</button>
          <button type="button" onClick={onRepost} className={`inline-flex items-center gap-1 hover:text-success ${reposted ? "text-success" : ""}`}><Repeat2 className="h-3.5 w-3.5" />{activity.reposts}</button>
          <Link href={("/posts/" + activity.id) as Route} className="inline-flex items-center gap-1 hover:text-info"><MessageCircle className="h-3.5 w-3.5" />{activity.comments}</Link>
          <button type="button" aria-label="اشتراک‌گذاری" className="hover:text-warning"><Share2 className="h-3.5 w-3.5" /></button>
        </div>
      </article>
    </section>
  );
}
