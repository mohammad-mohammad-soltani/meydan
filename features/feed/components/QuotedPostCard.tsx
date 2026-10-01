"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { BadgeCheck, Play } from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { OfficialBadge } from "@/components/shared/OfficialBadge";
import { SpeakerBadge } from "@/components/shared/SpeakerBadge";
import { MEDIA_THUMB_QUALITY } from "@/features/media/media-utils";
import type { QuotedPost } from "../types";

type QuotedPostCardProps = {
  quote: QuotedPost;
  /** Composer preview: no link, and room for a remove button. */
  preview?: boolean;
  className?: string;
};

/** The post a quote embeds: author line, a short excerpt and a single thumbnail. */
export function QuotedPostCard({ quote, preview = false, className = "" }: QuotedPostCardProps) {
  const frame = `block w-full overflow-hidden rounded-[14px] border border-border bg-surface text-right ${className}`;

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
      <span className="flex min-w-0 items-center gap-1.5 px-3 pt-2.5">
        {author.avatarUrl ? (
          <OptimizedAvatar src={author.avatarUrl} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[9px] font-black text-brand-foreground">
            {author.name.slice(0, 1)}
          </span>
        )}
        <span className="min-w-0 truncate text-[13px] font-black text-foreground">{author.name}</span>
        {author.verified ? <BadgeCheck aria-label="حساب تأییدشده" className="h-4 w-4 shrink-0 fill-verified text-on-solid" /> : null}
        <SpeakerBadge verified={author.verifiedSpeaker} size="sm" />
        <OfficialBadge official={author.verifiedOfficial} size="sm" />
        {quote.timeAgo ? (
          <>
            <span aria-hidden="true" className="shrink-0 text-[11px] text-foreground-subtle">·</span>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{quote.timeAgo}</span>
          </>
        ) : null}
      </span>

      {quote.body ? (
        <span className="mt-1 line-clamp-4 block whitespace-pre-line break-words px-3 text-[13px] leading-6 text-foreground">{quote.body}</span>
      ) : null}

      {thumb ? (
        <span className="relative mt-2 block aspect-[16/9] w-full overflow-hidden bg-surface-muted">
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
      <span className="block h-2.5" />
    </>
  );

  if (preview) {
    return <div dir="rtl" className={frame}>{content}</div>;
  }

  return (
    <Link
      dir="rtl"
      href={`/posts/${quote.id}` as Route}
      aria-label={`مشاهده روایت ${author.name}`}
      className={`pointer-events-auto relative z-10 transition-colors hover:bg-hover ${frame}`}
    >
      {content}
    </Link>
  );
}
