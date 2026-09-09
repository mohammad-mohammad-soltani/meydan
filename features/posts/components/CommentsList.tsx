import type { ReactNode } from "react";
import type { PostComment } from "../types";

export function CommentsList({ comments, composer }: { comments: PostComment[]; composer: ReactNode; children?: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold text-foreground">نظرات و گفتگوها <span className="font-normal text-foreground-subtle">({comments.length} نظر)</span></h2>
      {composer}
      {comments.length ? (
        <div className="divide-y divide-divider">
          {comments.map((comment) => (
            <article key={comment.id} className={`flex gap-2.5 py-3 ${comment.id.startsWith("comment-") ? "ui-enter" : ""}`}>
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${comment.isAuthor ? "bg-brand text-brand-foreground" : "bg-surface-muted text-foreground-secondary"}`}>{comment.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><strong className={comment.isAuthor ? "text-xs text-brand" : "text-xs text-foreground"}>{comment.author}</strong><span className="shrink-0 text-[10px] text-foreground-subtle">{comment.timeAgo}</span></div>
                <p className="mt-1 text-[11px] leading-6 text-foreground-secondary">{comment.content}</p>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="rounded-control border border-dashed border-border-strong p-4 text-center text-xs text-muted-foreground">هنوز نظری ثبت نشده است.</p>}
    </section>
  );
}
