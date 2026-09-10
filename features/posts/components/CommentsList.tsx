import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { PostComment } from "../types";

export function CommentsList({ comments, composer, total }: { comments: PostComment[]; composer: ReactNode; total: number; children?: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-black text-foreground">
        نظرات و گفتگوها <span className="font-normal text-foreground-subtle">({total} نظر)</span>
      </h2>

      {composer}

      {comments.length ? (
        <div className="space-y-2">
          {comments.map((comment) => {
            const profileHref = comment.authorId
              ? `/profile/${comment.authorType || "user"}/${comment.authorId}`
              : "#";

            return (
              <article
                key={comment.id}
                className={`group relative flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm transition-all duration-200 hover:border-border-strong hover:bg-hover ${comment.id.startsWith("comment-") ? "ui-enter" : ""}`}
                dir="rtl"
              >
                <Link href={profileHref} className="shrink-0">
                  {comment.avatarUrl ? (
                    <Image
                      src={comment.avatarUrl}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized={comment.avatarUrl.startsWith("http")}
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-border transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-muted text-xs font-black text-foreground-secondary ring-1 ring-border">
                      {comment.initials}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={profileHref} className="truncate text-sm font-black text-foreground hover:underline">
                      {comment.author}
                    </Link>

                    {comment.verified ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" aria-label="تأیید شده" />
                    ) : null}

                    {comment.isAuthor ? (
                      <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold text-brand">
                        نویسنده
                      </span>
                    ) : null}

                    <span className="mr-auto text-[10px] text-foreground-subtle">
                      {comment.timeAgo}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-7 text-foreground-secondary">
                    {comment.content}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-xs text-muted-foreground">
          هنوز نظری ثبت نشده است.
        </p>
      )}
    </section>
  );
}
