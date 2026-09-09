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
  LoaderCircle,
  MapPin,
  Pause,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Headphones,
} from "lucide-react";
import type { ContentDetailItem } from "../types";
import { meydanApi } from "@/lib/meydan-api";
import { AudioMediaStage } from "./AudioMediaStage";

type ContentDetailViewProps = { item: ContentDetailItem; relatedItems: ContentDetailItem[] };

const kindLabels = { image: "بسته تصویری", audio: "محتوای صوتی", video: "ویدئو", document: "متن و سند" };
const kindIcons = { image: Sparkles, audio: Headphones, video: Clapperboard, document: FileText };

function MediaStage({ item, isPlaying, onPlayingChange }: { item: ContentDetailItem; isPlaying: boolean; onPlayingChange: (value: boolean) => void }) {
  if (item.media.kind === "audio") {
    return <AudioMediaStage item={item} isPlaying={isPlaying} onPlayingChange={onPlayingChange} />;
  }

  if (item.media.kind === "document") {
    return (
      <div className="bg-surface-sunken p-5">
        <div className="mx-auto max-w-sm rounded-sm border border-border bg-solid-light px-6 py-7 text-on-light shadow-popover">
          <div className="flex items-center justify-between border-b-2 border-brand pb-4">
            <div><p className="text-[10px] font-black text-brand">فیش آماده ارائه</p><p className="mt-1 text-sm font-black leading-6">{item.title}</p></div>
            <FileText aria-hidden="true" className="h-7 w-7 shrink-0 text-icon-muted" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-2.5 w-full rounded-full bg-skeleton" /><div className="h-2.5 w-11/12 rounded-full bg-skeleton" /><div className="h-2.5 w-4/5 rounded-full bg-skeleton" /><div className="my-5 h-px bg-divider" /><div className="h-2.5 w-full rounded-full bg-skeleton" /><div className="h-2.5 w-10/12 rounded-full bg-skeleton" /><div className="h-2.5 w-3/4 rounded-full bg-skeleton" />
          </div>
          <p className="mt-7 text-center text-[10px] font-bold text-foreground-subtle">پیش‌نمایش صفحهٔ نخست</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunken sm:aspect-video">
      <Image src={item.media.coverImage ?? "/images/generated/content-hero.svg"} alt={item.title} fill priority sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-scrim via-overlay to-transparent" />
      {item.media.kind === "video" ? (
        <button type="button" onClick={() => onPlayingChange(!isPlaying)} aria-label={isPlaying ? "توقف پخش ویدئو" : "پخش ویدئو"} className="absolute inset-0 m-auto grid h-16 w-16 cursor-pointer place-items-center rounded-full border border-border-strong bg-overlay text-on-solid shadow-dialog backdrop-blur-sm outline-none transition hover:scale-105 hover:bg-brand focus-visible:ring-2 focus-visible:ring-ring">
          {isPlaying ? <Pause aria-hidden="true" className="h-7 w-7 fill-current" /> : <Play aria-hidden="true" className="mr-0.5 h-7 w-7 fill-current" />}
        </button>
      ) : null}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-on-solid">
        <span className="rounded-pill bg-scrim px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">{kindLabels[item.media.kind]}</span>
        {item.media.duration ? <span className="rounded-pill bg-scrim px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">{item.media.duration}</span> : null}
      </div>
    </div>
  );
}

export function ContentDetailView({ item, relatedItems }: ContentDetailViewProps) {
  const [isSaved, setIsSaved] = useState(Boolean(item.viewerState?.bookmarked));
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const KindIcon = kindIcons[item.media.kind];

  const handleShare = async () => {
    const shareData = { title: item.title, text: item.description, url: window.location.href };
    const canUseNativeShare = typeof navigator.share === "function";
    try {
      await meydanApi(`/content/${item.apiId}/share`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } });
      if (canUseNativeShare) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
      setNotice(canUseNativeShare ? "پنجرهٔ اشتراک‌گذاری باز شد." : "لینک محتوا کپی شد.");
    } catch { setNotice("اشتراک‌گذاری لغو شد."); }
  };

  const handleDownload = async (fileId: string, label: string) => {
    setDownloadingId(fileId);
    setNotice("");
    try {
      const file = item.files.find((candidate) => candidate.id === fileId);
      const result = await meydanApi<{ file?: { url?: string } }>(`/content/${item.apiId}/files/${fileId}/download`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() } });
      const url = result.file?.url || file?.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      setNotice(`دانلود «${label}» آغاز شد.`);
    } catch {
      const url = item.files.find((file) => file.id === fileId)?.url;
      if (url) { window.open(url, "_blank", "noopener,noreferrer"); setNotice(`دانلود «${label}» آغاز شد.`); }
      else setNotice("دانلود فایل با خطا مواجه شد.");
    }
    finally { setDownloadingId(null); }
  };

  const toggleBookmark = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try { await meydanApi(`/content/${item.apiId}/bookmark`, { method: next ? "PUT" : "DELETE" }); }
    catch { setIsSaved(!next); setNotice("ذخیره‌سازی محتوا انجام نشد."); }
  };

  const scrollToDownloads = () => document.getElementById("download-options")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const panelClass = "rounded-panel border border-border bg-card p-5 text-card-foreground shadow-xs";

  return (
    <article className="ui-enter min-h-full bg-background pb-6 text-foreground">
      <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-surface-glass px-3 backdrop-blur-md lg:top-0">
        <Link href="/content" className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control px-2 text-sm font-black text-foreground outline-none transition-colors hover:bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"><ArrowRight aria-hidden="true" className="h-5 w-5" />محتوا</Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void toggleBookmark()} aria-label={isSaved ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای بعد"} aria-pressed={isSaved} className={`grid h-11 w-11 cursor-pointer place-items-center rounded-control outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${isSaved ? "bg-brand-muted text-brand" : "text-icon-muted hover:bg-hover hover:text-brand"}`}><Bookmark aria-hidden="true" className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} /></button>
          <button type="button" onClick={handleShare} aria-label="اشتراک‌گذاری محتوا" className="grid h-11 w-11 cursor-pointer place-items-center rounded-control text-icon-muted outline-none transition-colors hover:bg-hover hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"><Share2 aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="overflow-hidden border-b border-border bg-surface"><MediaStage item={item} isPlaying={isPlaying} onPlayingChange={setIsPlaying} /></div>

      <div className="space-y-4 p-4">
        <section className={panelClass}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-muted px-3 py-1.5 text-[11px] font-black text-brand"><KindIcon aria-hidden="true" className="h-3.5 w-3.5" />{kindLabels[item.media.kind]}</span>
            {item.badge ? <span className="rounded-pill border border-warning-border bg-warning-surface px-3 py-1.5 text-[11px] font-black text-warning">{item.badge}</span> : null}
          </div>
          <h1 className="mt-4 text-2xl font-black leading-[1.55] tracking-tight text-foreground">{item.title}</h1>
          <p className="mt-3 text-base leading-8 text-foreground-secondary">{item.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-y border-divider py-3 text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4" />{item.publishedAt}</span>
            {item.location ? <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4" />{item.location}</span> : null}
            <span className="inline-flex items-center gap-1.5"><Eye aria-hidden="true" className="h-4 w-4" />{item.viewCount} بازدید</span>
            <span className="inline-flex items-center gap-1.5"><Download aria-hidden="true" className="h-4 w-4" />{item.downloadCount} دریافت</span>
          </div>
          <button type="button" onClick={scrollToDownloads} className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-card bg-brand px-5 text-sm font-black text-brand-foreground shadow-card outline-none transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Download aria-hidden="true" className="h-5 w-5" />مشاهده فایل‌های دانلود</button>
        </section>

        <section className={panelClass} aria-labelledby="creator-heading">
          <p id="creator-heading" className="text-xs font-black text-muted-foreground">تولیدکننده محتوا</p>
          <div className="mt-3 flex items-center gap-3">
            {item.creator.avatar ? <Image src={item.creator.avatar} alt="" width={64} height={64} unoptimized={item.creator.avatar.startsWith("http")} className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-border" /> : <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-surface-muted text-lg font-black text-icon ring-1 ring-border">{item.creator.name.slice(0, 1)}</span>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5"><h2 className="text-sm font-black text-foreground">{item.creator.name}</h2><span title="تولیدکننده تأییدشده" aria-label="تولیدکننده تأییدشده" className="grid h-4 w-4 place-items-center rounded-full bg-verified text-on-solid"><Check aria-hidden="true" className="h-3 w-3" /></span></div>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.creator.role}</p>
              <p className="mt-0.5 text-[11px] font-bold text-brand">{item.creator.publishedCount}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-foreground-secondary">{item.creator.bio}</p>
        </section>

        <section className={panelClass} aria-labelledby="about-content-heading">
          <h2 id="about-content-heading" className="text-base font-black text-foreground">درباره این محتوا</h2>
          <div className="mt-4 space-y-4">{item.body.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-foreground-secondary">{paragraph}</p>)}</div>
          <div className="mt-5 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-pill border border-border bg-surface-muted px-3 py-1.5 text-xs font-bold text-foreground-secondary">#{tag}</span>)}</div>
        </section>

        <section id="download-options" className={`scroll-mt-20 ${panelClass}`} aria-labelledby="download-heading">
          <div className="flex items-start justify-between gap-3">
            <div><h2 id="download-heading" className="text-base font-black text-foreground">فایل‌های قابل دانلود</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">فرمت مناسب استفاده‌تان را انتخاب کنید.</p></div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-muted text-brand"><Download aria-hidden="true" className="h-5 w-5" /></span>
          </div>
          <div className="mt-4 divide-y divide-divider">
            {item.files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-0">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-[11px] font-black text-foreground-secondary">{file.format}</span>
                <div className="min-w-0 flex-1"><h3 className="text-sm font-black text-foreground">{file.label}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{file.detail} · {file.size}</p></div>
                <button type="button" onClick={() => void handleDownload(file.id, file.label)} disabled={downloadingId === file.id} aria-label={`دانلود ${file.label}`} className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-border px-3 text-xs font-black text-foreground-secondary outline-none transition-colors hover:border-brand-border hover:text-brand focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:bg-disabled disabled:text-disabled-foreground">
                  {downloadingId === file.id ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}دریافت
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2 rounded-card border border-success-border bg-success-surface p-3 text-success-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-xs leading-6"><strong className="block font-black">مجوز استفاده و بازنشر</strong>{item.usageNote}</p></div>
        </section>

        {relatedItems.length ? (
          <section aria-labelledby="related-heading">
            <div className="flex items-center justify-between px-1"><h2 id="related-heading" className="text-base font-black text-foreground">محتوای مرتبط</h2><Link href="/content" className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-brand">همه محتواها<ArrowLeft aria-hidden="true" className="h-4 w-4" /></Link></div>
            <div className="space-y-2.5">
              {relatedItems.map((related) => {
                const RelatedIcon = kindIcons[related.media.kind];
                return (
                  <Link key={related.id} href={`/content/${related.id}` as Route} className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-card border border-border bg-card p-3 outline-none transition-colors hover:border-brand-border hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-muted text-brand"><RelatedIcon aria-hidden="true" className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><strong className="line-clamp-1 block text-sm text-foreground">{related.title}</strong><small className="mt-1 block text-[11px] text-muted-foreground">{kindLabels[related.media.kind]} · {related.creator.name}</small></span>
                    <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-icon-muted transition-colors group-hover:text-brand" />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-solid-dark px-4 py-2.5 text-center text-xs font-bold text-on-solid shadow-dialog transition lg:bottom-5 ${notice ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Check aria-hidden="true" className="h-4 w-4 text-success" />{notice || "انجام شد"}</span></p>
    </article>
  );
}