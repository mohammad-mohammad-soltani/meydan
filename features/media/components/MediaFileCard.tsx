"use client";

import { Download, FileText } from "lucide-react";
import type { MediaItem } from "../types";

type MediaFileCardProps = {
  item: MediaItem;
  /** `bubble` matches chat bubbles; `surface` matches feed/post/content cards. */
  tone?: "surface" | "bubble";
};

/** Non-visual attachment row: one look for feed posts, post pages and chat. */
export function MediaFileCard({ item, tone = "surface" }: MediaFileCardProps) {
  const href = item.downloadHref || item.src;

  return (
    <div
      data-media-interactive
      className={
        tone === "bubble"
          ? "mb-1.5 flex min-w-[220px] items-center gap-2 rounded-xl bg-active p-2.5"
          : "mt-2.5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3"
      }
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
          tone === "bubble" ? "rounded-lg bg-surface-glass opacity-80" : "bg-brand-muted text-brand"
        }`}
      >
        <FileText aria-hidden="true" className="h-[18px] w-[18px]" />
      </span>

      <span className="min-w-0 flex-1 text-right">
        <strong className="block truncate text-[13px] font-bold">{item.title}</strong>
        {item.detail ? (
          <span className="mt-0.5 block truncate text-[11px] opacity-70">{item.detail}</span>
        ) : null}
      </span>

      {href ? (
        <a
          href={href}
          download={item.title}
          target="_blank"
          rel="noreferrer"
          aria-label={`دانلود ${item.title}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-muted px-2.5 text-xs font-black text-brand shadow-xs outline-none transition-[background-color,border-color,color,transform] hover:border-brand hover:bg-brand hover:text-brand-foreground active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring min-[420px]:px-3"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          <span className="hidden min-[420px]:inline">دانلود</span>
        </a>
      ) : null}
    </div>
  );
}
