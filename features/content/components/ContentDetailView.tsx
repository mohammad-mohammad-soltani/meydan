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
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ContentDetailItem } from "../types";

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
  onTogglePlayback,
}: {
  item: ContentDetailItem;
  isPlaying: boolean;
  onTogglePlayback: () => void;
}) {
  if (item.media.kind === "audio") {
    const bars = [
      25, 42, 68, 38, 76, 48, 86, 55, 34, 72, 46, 90, 62, 37, 70, 45, 82, 52,
      31, 64, 44, 74, 36, 58,
    ];
    return (
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,.5),transparent_42%),linear-gradient(145deg,#161b27,#05070b)] px-5 py-9 text-white">
        <div
          className="absolute -left-20 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.035]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
            <Headphones aria-hidden="true" className="h-7 w-7" />
          </span>
          <p className="mt-4 text-xs font-bold text-red-200">پیش‌نمایش صوت</p>
          <p className="mt-1 max-w-sm text-base font-black leading-7">
            {item.title}
          </p>
          <div
            className="mt-6 flex h-16 w-full items-center justify-center gap-1"
            aria-hidden="true"
          >
            {bars.map((height, index) => (
              <span
                key={index}
                className={
                  "w-1 rounded-full " +
                  (index < 9 ? "bg-brand-red" : "bg-white/25")
                }
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex w-full items-center gap-3" dir="ltr">
            <span className="w-9 text-left text-[11px] tabular-nums text-slate-300">
              ۰:۴۸
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-1/4 rounded-full bg-brand-red" />
            </div>
            <span className="w-9 text-right text-[11px] tabular-nums text-slate-300">
              {item.media.duration}
            </span>
          </div>
          <button
            type="button"
            onClick={onTogglePlayback}
            aria-label={isPlaying ? "توقف پیش‌نمایش صوت" : "پخش پیش‌نمایش صوت"}
            className="mt-5 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-white text-slate-950 shadow-xl outline-none transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="h-6 w-6 fill-current" />
            ) : (
              <Play
                aria-hidden="true"
                className="mr-0.5 h-6 w-6 fill-current"
              />
            )}
          </button>
        </div>
      </div>
    );
  }

  if (item.media.kind === "document") {
    return (
      <div className="bg-slate-100 p-5 dark:bg-slate-950">
        <div className="mx-auto max-w-sm rounded-sm border border-slate-200 bg-white px-6 py-7 text-slate-900 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-100">
          <div className="flex items-center justify-between border-b-2 border-brand-red pb-4">
            <div>
              <p className="text-[10px] font-black text-brand-red">
                فیش آماده ارائه
              </p>
              <p className="mt-1 text-sm font-black leading-6">{item.title}</p>
            </div>
            <FileText
              aria-hidden="true"
              className="h-7 w-7 shrink-0 text-slate-400"
            />
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-2.5 w-full rounded-full bg-slate-200" />
            <div className="h-2.5 w-11/12 rounded-full bg-slate-200" />
            <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
            <div className="my-5 h-px bg-slate-200" />
            <div className="h-2.5 w-full rounded-full bg-slate-200" />
            <div className="h-2.5 w-10/12 rounded-full bg-slate-200" />
            <div className="h-2.5 w-3/4 rounded-full bg-slate-200" />
          </div>
          <p className="mt-7 text-center text-[10px] font-bold text-slate-400">
            پیش‌نمایش صفحهٔ نخست
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-950 sm:aspect-video">
      <Image
        src={item.media.coverImage ?? "/images/generated/content-hero.svg"}
        alt={item.title}
        fill
        priority
        sizes="(max-width: 640px) 100vw, 576px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {item.media.kind === "video" ? (
        <button
          type="button"
          onClick={onTogglePlayback}
          aria-label={isPlaying ? "توقف پخش ویدئو" : "پخش ویدئو"}
          className="absolute inset-0 m-auto grid h-16 w-16 cursor-pointer place-items-center rounded-full border border-white/30 bg-black/45 text-white shadow-2xl backdrop-blur-sm outline-none transition hover:scale-105 hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-white"
        >
          {isPlaying ? (
            <Pause aria-hidden="true" className="h-7 w-7 fill-current" />
          ) : (
            <Play aria-hidden="true" className="mr-0.5 h-7 w-7 fill-current" />
          )}
        </button>
      ) : null}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
          {kindLabels[item.media.kind]}
        </span>
        {item.media.duration ? (
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
            {item.media.duration}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ContentDetailView({
  item,
  relatedItems,
}: ContentDetailViewProps) {
  const [isSaved, setIsSaved] = useState(false);
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
      if (canUseNativeShare) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
      setNotice(
        canUseNativeShare
          ? "پنجرهٔ اشتراک‌گذاری باز شد."
          : "لینک محتوا کپی شد.",
      );
    } catch {
      setNotice("اشتراک‌گذاری لغو شد.");
    }
  };

  const handleDownload = (fileId: string, label: string) => {
    setDownloadingId(fileId);
    setNotice("");
    window.setTimeout(() => {
      setDownloadingId(null);
      setNotice(`دانلود «${label}» آغاز شد.`);
    }, 650);
  };

  const scrollToDownloads = () =>
    document
      .getElementById("download-options")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <article className="post-detail-enter min-h-full bg-slate-50 pb-6 dark:bg-[#070a0f]">
      <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-[#070a0f]/95 lg:top-0">
        <Link
          href="/content"
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-2 text-sm font-black text-slate-800 outline-none transition hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red dark:text-white"
        >
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
          محتوا
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsSaved((value) => !value);
              setNotice(
                isSaved ? "از ذخیره‌شده‌ها حذف شد." : "برای بعد ذخیره شد.",
              );
            }}
            aria-label={isSaved ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای بعد"}
            aria-pressed={isSaved}
            className={
              "grid h-11 w-11 cursor-pointer place-items-center rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-brand-red " +
              (isSaved
                ? "bg-brand-red/10 text-brand-red"
                : "text-slate-500 hover:bg-slate-100 hover:text-brand-red dark:hover:bg-slate-900")
            }
          >
            <Bookmark
              aria-hidden="true"
              className={"h-5 w-5 " + (isSaved ? "fill-current" : "")}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="اشتراک‌گذاری محتوا"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-slate-500 outline-none transition hover:bg-slate-100 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red dark:hover:bg-slate-900"
          >
            <Share2 aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/30">
        <MediaStage
          item={item}
          isPlaying={isPlaying}
          onTogglePlayback={() => setIsPlaying((value) => !value)}
        />
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/45">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/10 px-3 py-1.5 text-[11px] font-black text-brand-red">
              <KindIcon aria-hidden="true" className="h-3.5 w-3.5" />
              {kindLabels[item.media.kind]}
            </span>
            {item.badge ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                {item.badge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-2xl font-black leading-[1.55] tracking-tight text-slate-950 dark:text-white">
            {item.title}
          </h1>
          <p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">
            {item.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-y border-slate-100 py-3 text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              {item.publishedAt}
            </span>
            {item.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {item.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Eye aria-hidden="true" className="h-4 w-4" />
              {item.viewCount} بازدید
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Download aria-hidden="true" className="h-4 w-4" />
              {item.downloadCount} دریافت
            </span>
          </div>
          <button
            type="button"
            onClick={scrollToDownloads}
            className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-red px-5 text-sm font-black text-white shadow-lg shadow-red-900/20 outline-none transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <Download aria-hidden="true" className="h-5 w-5" />
            مشاهده فایل‌های دانلود
          </button>
        </section>

        <section
          className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/45"
          aria-labelledby="creator-heading"
        >
          <p id="creator-heading" className="text-xs font-black text-slate-500">
            تولیدکننده محتوا
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Image
              src={item.creator.avatar}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-slate-950 dark:text-white">
                  {item.creator.name}
                </h2>
                <span
                  title="تولیدکننده تأییدشده"
                  aria-label="تولیدکننده تأییدشده"
                  className="grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-white"
                >
                  <Check aria-hidden="true" className="h-3 w-3" />
                </span>
              </div>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                {item.creator.role}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-brand-red">
                {item.creator.publishedCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {item.creator.bio}
          </p>
        </section>

        <section
          className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/45"
          aria-labelledby="about-content-heading"
        >
          <h2
            id="about-content-heading"
            className="text-base font-black text-slate-950 dark:text-white"
          >
            درباره این محتوا
          </h2>
          <div className="mt-4 space-y-4">
            {item.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-8 text-slate-700 dark:text-slate-300"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        <section
          id="download-options"
          className="scroll-mt-20 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/45"
          aria-labelledby="download-heading"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="download-heading"
                className="text-base font-black text-slate-950 dark:text-white"
              >
                فایل‌های قابل دانلود
              </h2>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                فرمت مناسب استفاده‌تان را انتخاب کنید.
              </p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-red/10 text-brand-red">
              <Download aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {item.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 py-4 first:pt-1 last:pb-0"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {file.format}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {file.label}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {file.detail} · {file.size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(file.id, file.label)}
                  disabled={downloadingId === file.id}
                  aria-label={`دانلود ${file.label}`}
                  className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 outline-none transition hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
                >
                  {downloadingId === file.id ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <Download aria-hidden="true" className="h-4 w-4" />
                  )}
                  دریافت
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <p className="text-xs leading-6">
              <strong className="block font-black">
                مجوز استفاده و بازنشر
              </strong>
              {item.usageNote}
            </p>
          </div>
        </section>

        {relatedItems.length ? (
          <section aria-labelledby="related-heading">
            <div className="flex items-center justify-between px-1">
              <h2
                id="related-heading"
                className="text-base font-black text-slate-950 dark:text-white"
              >
                محتوای مرتبط
              </h2>
              <Link
                href="/content"
                className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-brand-red"
              >
                همه محتواها
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {relatedItems.map((related) => {
                const RelatedIcon = kindIcons[related.media.kind];
                return (
                  <Link
                    key={related.id}
                    href={`/content/${related.id}` as Route}
                    className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 outline-none transition hover:border-brand-red/35 focus-visible:ring-2 focus-visible:ring-brand-red dark:border-slate-800 dark:bg-slate-900/45"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-red/10 text-brand-red">
                      <RelatedIcon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="line-clamp-1 block text-sm text-slate-900 dark:text-white">
                        {related.title}
                      </strong>
                      <small className="mt-1 block text-[11px] text-slate-500">
                        {kindLabels[related.media.kind]} ·{" "}
                        {related.creator.name}
                      </small>
                    </span>
                    <ArrowLeft
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-red"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-center text-xs font-bold text-white shadow-2xl transition lg:bottom-5 " +
          (notice
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0")
        }
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Check aria-hidden="true" className="h-4 w-4 text-emerald-400" />
          {notice || "انجام شد"}
        </span>
      </p>
    </article>
  );
}
