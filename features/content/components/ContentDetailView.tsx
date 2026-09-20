"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  Clapperboard,
  Download,
  Eye,
  FileText,
  Headphones,
  LoaderCircle,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ContentDetailItem } from "../types";
import { meydanApi } from "@/lib/meydan-api";
import { MediaLightbox } from "@/features/media/components/MediaLightbox";
import { VideoPlayer } from "@/features/media/components/VideoPlayer";
import { AudioMediaStage } from "./AudioMediaStage";

type ContentDetailViewProps = {
  item: ContentDetailItem;
  relatedItems: ContentDetailItem[];
};

const kindLabels = {
  image: "بسته تصویری",
  audio: "محتوای صوتی",
  video: "ویدئو",
  document: "متن و سند",
};

const kindIcons = {
  image: Sparkles,
  audio: Headphones,
  video: Clapperboard,
  document: FileText,
};

function MediaStage({
  item,
  isPlaying,
  onPlayingChange,
}: {
  item: ContentDetailItem;
  isPlaying: boolean;
  onPlayingChange: (value: boolean) => void;
}) {
  const [coverOpen, setCoverOpen] = useState(false);

  if (item.media.kind === "audio") {
    return (
      <AudioMediaStage
        item={item}
        isPlaying={isPlaying}
        onPlayingChange={onPlayingChange}
      />
    );
  }

  if (item.media.kind === "document") {
    return (
      <div className="bg-surface-sunken px-4 py-7 sm:px-6">
        <div className="mx-auto max-w-sm overflow-hidden rounded-[18px] border border-border bg-solid-light text-on-light shadow-popover">
          <div className="flex items-start justify-between gap-4 border-b border-divider px-5 py-5">
            <div className="min-w-0 text-right" dir="rtl">
              <p className="text-[10px] font-black text-brand">
                فیش آماده ارائه
              </p>
              <p className="mt-1.5 text-sm font-black leading-6">
                {item.title}
              </p>
            </div>

            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-icon-muted">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>

          <div className="px-5 py-6">
            <div className="space-y-3">
              <div className="h-2.5 w-full rounded-full bg-skeleton" />
              <div className="h-2.5 w-11/12 rounded-full bg-skeleton" />
              <div className="h-2.5 w-4/5 rounded-full bg-skeleton" />
              <div className="my-5 h-px bg-divider" />
              <div className="h-2.5 w-full rounded-full bg-skeleton" />
              <div className="h-2.5 w-10/12 rounded-full bg-skeleton" />
              <div className="h-2.5 w-3/4 rounded-full bg-skeleton" />
            </div>

            <p className="mt-6 text-center text-[10px] font-bold text-foreground-subtle">
              پیش‌نمایش صفحهٔ نخست
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (item.media.kind === "video" && item.media.videoSrc) {
    return (
      <div className="bg-surface-sunken px-3 py-3 sm:px-4">
        <VideoPlayer
          item={{
            id: `content:${item.apiId}`,
            kind: "video",
            title: item.title,
            src: item.media.videoSrc,
            poster: item.media.coverImage,
            width: item.media.videoWidth,
            height: item.media.videoHeight,
          }}
          variant="inline"
          className="mx-auto max-w-3xl"
        />
      </div>
    );
  }

  if (item.media.kind === "video") return null;
    console.log(item.media)
  if(!item.media.coverImage ) return null;
  const coverSrc = item.media.coverImage ;

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken sm:aspect-video">
      <button
        type="button"
        onClick={() => setCoverOpen(true)}
        aria-label={`نمایش تمام‌صفحهٔ ${item.title}`}
        className="group/media absolute inset-0 block cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={coverSrc}
          alt={item.title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 720px"
          className="object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
        />
      </button>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2"
        dir="rtl"
      >
        <span className="rounded-full bg-scrim/75 px-2.5 py-1 text-[10px] font-bold text-on-solid backdrop-blur-sm">
          {kindLabels[item.media.kind]}
        </span>

        {item.media.duration ? (
          <span className="rounded-full bg-scrim/75 px-2.5 py-1 text-[10px] font-bold text-on-solid backdrop-blur-sm">
            {item.media.duration}
          </span>
        ) : null}
      </div>

      {coverOpen ? (
        <MediaLightbox
          items={[
            {
              id: `content:${item.apiId}`,
              kind: "image",
              title: item.title,
              src: coverSrc,
            },
          ]}
          index={0}
          onIndexChange={() => undefined}
          onClose={() => setCoverOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function ContentDetailView({
  item,
  relatedItems,
}: ContentDetailViewProps) {
  const [isSaved, setIsSaved] = useState(
    Boolean(item.viewerState?.bookmarked),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const KindIcon = kindIcons[item.media.kind];

  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: item.description,
      url: window.location.href,
    };

    const canUseNativeShare = typeof navigator.share === "function";

    try {
      await meydanApi(`/content/${item.apiId}/share`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      });

      if (canUseNativeShare) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }

      setNotice(
        canUseNativeShare
          ? "پنجرهٔ اشتراک‌گذاری باز شد."
          : "لینک محتوا کپی شد.",
      );
    } catch {
      setNotice("اشتراک‌گذاری لغو شد.");
    }
  };

  const handleDownload = async (fileId: string, label: string) => {
    setDownloadingId(fileId);
    setNotice("");

    try {
      const file = item.files.find((candidate) => candidate.id === fileId);

      const result = await meydanApi<{ file?: { url?: string } }>(
        `/content/${item.apiId}/files/${fileId}/download`,
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
        },
      );

      const url = result.file?.url || file?.url;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setNotice(`دانلود «${label}» آغاز شد.`);
    } catch {
      const url = item.files.find((file) => file.id === fileId)?.url;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        setNotice(`دانلود «${label}» آغاز شد.`);
      } else {
        setNotice("دانلود فایل با خطا مواجه شد.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleBookmark = async () => {
    const next = !isSaved;
    setIsSaved(next);

    try {
      await meydanApi(`/content/${item.apiId}/bookmark`, {
        method: next ? "PUT" : "DELETE",
      });
    } catch {
      setIsSaved(!next);
      setNotice("ذخیره‌سازی محتوا انجام نشد.");
    }
  };

  const scrollToDownloads = () =>
    document
      .getElementById("download-options")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  
    const files = item.files.filter((data) => data.id !== 'undefined');
    return (

    <article className="ui-enter min-h-full bg-background pb-8 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-divider bg-surface-glass px-2 backdrop-blur-md">
        <Link
          href="/content"
          className="inline-flex min-h-10 items-center gap-1 rounded-full px-2.5 text-sm font-black text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" />
          محتوا
        </Link>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => void toggleBookmark()}
            aria-label={
              isSaved ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای بعد"
            }
            aria-pressed={isSaved}
            className={`grid h-10 w-10 place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              isSaved
                ? "bg-brand-muted text-brand"
                : "text-icon-muted hover:bg-hover hover:text-brand"
            }`}
          >
            <Bookmark
              aria-hidden="true"
              className={`h-[19px] w-[19px] ${isSaved ? "fill-current" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="اشتراک‌گذاری محتوا"
            className="grid h-10 w-10 place-items-center rounded-full text-icon-muted outline-none transition-colors hover:bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share2 aria-hidden="true" className="h-[19px] w-[19px]" />
          </button>
        </div>
      </header>

      {/* Media */}
      <div className="border-b border-divider bg-surface">
        <MediaStage
          item={item}
          isPlaying={isPlaying}
          onPlayingChange={setIsPlaying}
        />
      </div>

      {/* Intro */}
      <section className="border-b border-divider px-4 py-5" dir="rtl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full flex justify-end">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-brand text-white p-1 rounded-full">
              <KindIcon aria-hidden="true" className="h-4 w-4" />
              {kindLabels[item.media.kind]}
            </span>
          </div>

          {item.badge ? (
            <>
              <span
                aria-hidden="true"
                className="text-foreground-subtle"
              >
                ·
              </span>
              <span className="text-[11px] font-bold text-warning">
                {item.badge}
              </span>
            </>
          ) : null}
        </div>

        <h1 className="mt-3 text-[22px] font-black leading-9 tracking-tight text-foreground sm:text-2xl">
          {item.title}
        </h1>


        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
            {item.publishedAt}
          </span>

          {item.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {item.location}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5">
            <Eye aria-hidden="true" className="h-3.5 w-3.5" />
            {item.viewCount} بازدید
          </span>
          {
            files.length > 0 &&

            <span className="inline-flex items-center gap-1.5">
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              {item.downloadCount} دریافت
            </span>
          }
        </div>

        {files.length ? (
          <button
            type="button"
            onClick={scrollToDownloads}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-brand px-4 text-xs font-black text-brand-foreground outline-none transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            فایل‌های دانلود
          </button>
        ) : null}
      </section>

      {/* Creator */}
      

      {/* Body */}
      <section
        className="border-b border-divider px-4 py-5"
        aria-labelledby="about-content-heading"
        dir="rtl"
      >
        <h2
          id="about-content-heading"
          className="text-[15px] font-black text-foreground"
        >
          محتوا :
        </h2>

        <div className="mt-4 space-y-4">
          {item.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-[14px] leading-8 text-foreground-secondary"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {item.tags.length ? (
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-bold text-brand"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Downloads */}
      {files.length > 0 ? (
        <section
          id="download-options"
          className="scroll-mt-20  border-divider px-4 py-5"
          aria-labelledby="download-heading"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="download-heading"
                className="text-[15px] font-black text-foreground"
              >
                فایل‌های قابل دانلود
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                فرمت مناسب استفاده‌تان را انتخاب کنید.
              </p>
            </div>

            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
              <Download aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3 divide-y divide-divider">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 py-3.5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted px-1 text-[10px] font-black text-foreground-secondary">
                  {file.format}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-black text-foreground">
                    {file.label}
                  </h3>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {file.detail} · {file.size}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleDownload(file.id, file.label)
                  }
                  disabled={downloadingId === file.id}
                  aria-label={`دانلود ${file.label}`}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-black text-foreground-secondary outline-none transition-colors hover:border-brand-border hover:text-brand focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:bg-disabled disabled:text-disabled-foreground"
                >
                  {downloadingId === file.id ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-3.5 w-3.5 animate-spin"
                    />
                  ) : (
                    <Download
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                  )}
                  دریافت
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2.5 rounded-[14px] bg-success-surface p-3 text-success-foreground">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-[18px] w-[18px] shrink-0"
            />
            <p className="text-[11px] leading-6">
              <strong className="block font-black">
                مجوز استفاده و بازنشر
              </strong>
              {item.usageNote}
            </p>
          </div>
        </section>
      ) : null}

      <section
        className="border-b border-divider px-4 py-4"
        aria-labelledby="creator-heading"
        dir="rtl"
      >
        <p
          id="creator-heading"
          className="mb-3 text-[11px] font-bold text-muted-foreground"
        >
          تولیدکننده محتوا
        </p>

        <div className="flex items-center gap-3">
          {item.creator.avatar ? (
            <Image
              src={item.creator.avatar}
              alt=""
              width={48}
              height={48}
              unoptimized={item.creator.avatar.startsWith("http")}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-black text-icon ring-1 ring-border"
            >
              {item.creator.name.slice(0, 1)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-sm font-black text-foreground">
                {item.creator.profileHref ? (
                  <Link
                    href={item.creator.profileHref as Route}
                    aria-label={`مشاهدهٔ صفحهٔ ${item.creator.name}`}
                    className="rounded-sm outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.creator.name}
                  </Link>
                ) : (
                  item.creator.name
                )}
              </h2>

              <span
                title="تولیدکننده تأییدشده"
                aria-label="تولیدکننده تأییدشده"
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-verified text-on-solid"
              >
                <Check aria-hidden="true" className="h-3 w-3" />
              </span>
            </div>

            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {item.creator.role}
            </p>
          </div>

          <span className="shrink-0 text-[10px] font-bold text-brand">
            {item.creator.publishedCount}
          </span>
        </div>

        {item.creator.bio ? (
          <p className="mt-3 text-[13px] leading-7 text-foreground-secondary">
            {item.creator.bio}
          </p>
        ) : null}
      </section>

      {/* Related */}
      {relatedItems.length ? (
        <section
          className="px-4 py-5"
          aria-labelledby="related-heading"
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="related-heading"
              className="text-[15px] font-black text-foreground"
            >
              محتوای مرتبط
            </h2>

            <Link
              href="/content"
              className="inline-flex min-h-9 items-center gap-1 text-[11px] font-black text-brand"
            >
              همه محتواها
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-2 divide-y divide-divider">
            {relatedItems.map((related) => {
              const RelatedIcon = kindIcons[related.media.kind];

              return (
                <Link
                  key={related.id}
                  href={`/content/${related.id}` as Route}
                  className="group flex min-h-[72px] items-center gap-3 py-3 outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
                    <RelatedIcon
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                    />
                  </span> */}

                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-1 block text-[13px] font-black text-foreground">
                      {related.title}
                    </strong>

                    <small className="mt-1 block truncate text-[10px] text-muted-foreground">
                      {kindLabels[related.media.kind]} · {related.creator.name}
                    </small>
                  </span>

                  <ArrowLeft
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-icon-muted transition-transform group-hover:-translate-x-0.5 group-hover:text-brand"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Toast */}
      <p
        role="status"
        aria-live="polite"
        className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-solid-dark px-4 py-2.5 text-center text-xs font-bold text-on-solid shadow-dialog transition lg:bottom-5 ${
          notice
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Check aria-hidden="true" className="h-4 w-4 text-success" />
          {notice || "انجام شد"}
        </span>
      </p>
    </article>
  );
}
