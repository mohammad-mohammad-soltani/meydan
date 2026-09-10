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
        <div className="divide-y divide-divider border-y border-divider">
          {comments.map((comment) => {
            const profileHref = comment.authorId
              ? `/profile/${comment.authorType || "user"}/${comment.authorId}`
              : "#";

            return (
              <article
                key={comment.id}
                className={`flex gap-3 py-4 transition-colors hover:bg-hover/40 ${comment.id.startsWith("comment-") ? "ui-enter" : ""}`}
                dir="rtl"
              >
                <Link href={profileHref} className="shrink-0">
                  {comment.avatarUrl ? (
                    <Image
                      src={comment.avatarUrl}
                      alt=""
                      width={42}
                      height={42}
                      unoptimized={comment.avatarUrl.startsWith("http")}
                      className="h-[42px] w-[42px] rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-surface-muted text-xs font-black text-foreground-secondary">
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

                    <span className="mr-auto text-[11px] text-foreground-subtle">
                      {comment.timeAgo}
                    </span>
                  </div>

                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-foreground-secondary">
                    {comment.content}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-control border border-dashed border-border-strong p-5 text-center text-xs text-muted-foreground">
          هنوز نظری ثبت نشده است.
        </p>
      )}
    </section>
  );
}
