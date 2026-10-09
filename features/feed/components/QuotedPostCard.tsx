"use client";

import styles from "../reference.module.css";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { Play, Quote } from "lucide-react";
import { MEDIA_THUMB_QUALITY } from "@/features/media/media-utils";
import type { QuotedPost } from "../types";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { MentionText } from "@/features/mentions/components/MentionText";

type QuotedPostCardProps = {
  quote: QuotedPost;
  /** Composer preview: no link, and room for a remove button. */
  preview?: boolean;
  className?: string;
};

/** The post a quote embeds: author line, a short excerpt and a single thumbnail. */
export function QuotedPostCard({ quote, preview = false, className = "" }: QuotedPostCardProps) {
  const frame = `${styles.quote} block w-full overflow-hidden rounded-2xl border border-border bg-surface text-right ${className}`;

  if (quote.unavailable || !quote.author) {
    return (
      <div dir="rtl" className={`${frame} px-3 py-3 text-xs text-muted-foreground`}>
        این روایت دیگر در دسترس نیست.
      </div>
    );
  }

  const visual = quote.attachments?.find((item) => (item.icon === "image" || item.icon === "video") && (item.previewSrc || item.posterSrc));
  const thumb = visual ? (visual.icon === "video" ? visual.posterSrc : visual.previewSrc) : undefined;
  const extra = (quote.attachments?.length ?? 0) - 1;
  const { author } = quote;

  const content = (
    <>
      <span className={`${styles.quoteHeader} flex min-w-0 items-center gap-2 border-b border-divider bg-surface-elevated/90 px-3.5 py-2.5`}>
        <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface-muted text-foreground">
          <Quote className="h-3.5 w-3.5 fill-current" />
        </span>
        <span className="min-w-0 truncate text-[11px] font-bold text-foreground">نقل‌قول از: {author.name}</span>
        <AccountBadges verified={author.verified} speaker={author.verifiedSpeaker} official={author.verifiedOfficial} kind={author.type} size="sm" />
        {quote.timeAgo ? <span className="mr-auto shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">{quote.timeAgo}</span> : null}
      </span>

      {quote.body ? (
        <span className={`${styles.quoteBody} text-foreground`}><span className="whitespace-pre-line break-words"><MentionText text={quote.body} interactive={false} /></span></span>
      ) : null}

      {thumb ? (
        <span className={`${styles.quoteThumb} relative block overflow-hidden bg-black/60`}>
          <Image
            src={thumb}
            alt={visual?.previewAlt || ""}
            fill
            quality={MEDIA_THUMB_QUALITY}
            sizes="(max-width: 640px) 90vw, 480px"
            className="object-cover"
            draggable={false}
          />
          {visual?.icon === "video" ? (
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white"><Play className="h-5 w-5 fill-current" /></span>
            </span>
          ) : null}
          {extra > 0 ? (
            <span className="absolute bottom-2 left-2 rounded-pill bg-black/60 px-2 py-0.5 text-[11px] font-black text-white">
              +{extra.toLocaleString("fa-IR")}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  if (preview) {
    return <div dir="rtl" data-has-thumbnail={Boolean(thumb)} className={frame}>{content}</div>;
  }

  return (
    <Link
      dir="rtl"
      data-has-thumbnail={Boolean(thumb)}
      href={`/posts/${quote.id}` as Route}
      aria-label={`مشاهده روایت ${author.name}`}
      className={`pointer-events-auto relative z-10 transition-colors hover:bg-hover ${frame}`}
    >
      {content}
    </Link>
  );
}
