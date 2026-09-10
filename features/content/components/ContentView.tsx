"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  FileText,
  Info,
  Mic,
  Music2,
  Pause,
  PhoneCall,
  Play,
  Printer,
  HandHeart,
  X,
} from "lucide-react";
import { generatedMedia } from "@/components/shared/generated-media";
import { useAudio } from "@/features/audio/AudioProvider";
import type { AudioTrack } from "@/features/audio/types";
import type { ContentItem, ContentQuickAction, ScheduleItem } from "../types";

const actionIcons = {
  speakers: Mic,
  contact: PhoneCall,
  print: Printer,
  safety: HandHeart,
};

const actionStyles = {
  speakers: "text-warning bg-warning-surface",
  contact: "text-success bg-success-surface",
  print: "text-info bg-info-surface",
  safety: "text-brand bg-brand-muted",
};

type DetailModal = { title: string; description: string } | null;

function contentToAudioTrack(item: ContentItem): AudioTrack | null {
  if (item.media.kind !== "audio" || !item.media.audioSrc) return null;

  return {
    id: `content:${item.apiId}`,
    title: item.title,
    artist: item.author,
    cover: item.media.coverImage,
    url: item.media.audioSrc,
    sourceHref: `/content/${item.id}`,
  };
}

function SectionHeader({
  icon,
  title,
  meta,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-muted text-icon">
            {icon}
          </span>
          <h3 className="truncate text-sm font-black text-foreground">{title}</h3>
        </div>

        {meta ? (
          <p className="mt-1 pr-9 text-[10px] leading-5 text-muted-foreground">
            {meta}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ContentView({
  items,
  scheduleItems,
  quickActions,
}: {
  items: ContentItem[];
  scheduleItems: ScheduleItem[];
  quickActions: ContentQuickAction[];
}) {
  const [detailModal, setDetailModal] = useState<DetailModal>(null);
  const { currentTrack, isPlaying, playTrack, toggle } = useAudio();

  const featuredItem =
    items.find((item) => item.category === "featured") || items[0];

  const talkItems = items
    .filter((item) => item.category === "talks")
    .slice(0, 2);

  const audioItem = items.find((item) => item.category === "audio");

  const audioQueue = items
    .map(contentToAudioTrack)
    .filter((track): track is AudioTrack => Boolean(track));

  const openQuickAction = (action: ContentQuickAction) => {
    const descriptions: Partial<Record<ContentQuickAction["id"], string>> = {
      speakers: "درخواست و پیگیری اعزام سخنران به میدان.",
      contact: "راه‌های ارتباط با ستاد مرکزی قرارگاه میدانِ خیابان.",
      print: "فایل‌های لایه‌باز آماده چاپ افست و سیلک.",
      safety: "راه‌های مشارکت، همیاری و همراهی با فعالیت‌های میدان.",
    };

    setDetailModal({
      title: action.label,
      description: descriptions[action.id] ?? action.detail,
    });
  };

  const handleAudioPlayback = async () => {
    if (!audioItem) return;

    const track = contentToAudioTrack(audioItem);
    if (!track) return;

    if (currentTrack?.id === track.id) {
      await toggle();
      return;
    }

    await playTrack(track, { queue: audioQueue });
  };

  const isAudioItemPlaying = Boolean(
    audioItem &&
      currentTrack?.id === `content:${audioItem.apiId}` &&
      isPlaying,
  );

  return (
    <section
      id="view-content"
      className="min-h-full bg-background pb-24 text-foreground"
    >
      {/* Featured content */}
      {featuredItem ? (
        <div className="px-3 pt-3 sm:px-4">
          <Link
            href={`/content/${featuredItem.id}` as Route}
            className="group relative block overflow-hidden rounded-[20px] border border-border bg-solid-dark"
          >
            <div className="relative h-[230px] w-full sm:h-[260px]">
              <img
                src={
                  featuredItem.media.coverImage || generatedMedia.contentHero
                }
                alt={featuredItem.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-solid-dark via-solid-dark/55 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="max-w-xl text-right" dir="rtl">
                  <span className="inline-flex rounded-full bg-brand px-2.5 py-1 text-[10px] font-black text-brand-foreground">
                    {featuredItem.badge || "منبر شبانه"}
                  </span>

                  <h2 className="mt-2 text-[18px] font-black leading-8 text-on-solid sm:text-xl">
                    {featuredItem.title}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-xs leading-6 text-on-solid/75">
                    {featuredItem.subtitle || featuredItem.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : null}

      {/* Quick actions */}
      {quickActions.length ? (
        <div className="mt-4 border-y border-divider bg-surface">
          <div className="grid grid-cols-4 divide-x divide-divider px-1 py-2.5">
            {quickActions.map((action) => {
              const Icon = actionIcons[action.icon];

              const body = (
                <>
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full ${actionStyles[action.icon]}`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>

                  <span className="mt-1.5 line-clamp-1 text-[10px] font-bold text-foreground-secondary">
                    {action.id === "safety" ? "همیاری" : action.label}
                  </span>
                </>
              );

              if (action.href) {
                return (
                  <Link
                    key={action.id}
                    href={action.href as Route}
                    className="flex min-w-0 flex-col items-center px-1 py-1.5 transition-colors hover:bg-hover"
                  >
                    {body}
                  </Link>
                );
              }

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => openQuickAction(action)}
                  className="flex min-w-0 flex-col items-center px-1 py-1.5 transition-colors hover:bg-hover"
                >
                  {body}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-7 px-3 pt-6 sm:px-4">
        {/* Schedule */}
        {scheduleItems.length ? (
          <section className="space-y-3">
            <SectionHeader
              icon={<Calendar className="h-4 w-4 text-brand" />}
              title="روزشمار تجمعات شبانه"
              meta="برنامه و محور محتوایی شب‌های تجمع"
              action={
                <span className="text-[11px] font-bold text-brand">
                  تمام ۴۰ شب
                </span>
              }
            />

            <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 no-scrollbar sm:-mx-4 sm:px-4">
              {scheduleItems.map((item, index) => {
                const base =
                  "relative flex h-[118px] w-[148px] shrink-0 flex-col justify-between overflow-hidden rounded-[16px] border p-3 text-right transition-[transform,background-color,border-color] active:scale-[0.98]";

                const classes = item.current
                  ? `${base} border-brand-border bg-brand text-brand-foreground`
                  : index === 0
                    ? `${base} border-danger-border bg-danger-surface text-danger`
                    : `${base} border-border bg-surface text-foreground hover:bg-hover`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setDetailModal({
                        title: `${item.night}: ${item.title}`,
                        description: item.description,
                      })
                    }
                    className={classes}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          item.current
                            ? "bg-on-solid/15 text-brand-foreground"
                            : "bg-surface-muted text-muted-foreground"
                        }`}
                      >
                        {item.night}
                      </span>

                      <span
                        aria-hidden="true"
                        className={`text-3xl font-black leading-none ${
                          item.current
                            ? "text-brand-foreground/20"
                            : "text-foreground/10"
                        }`}
                      >
                        {item.number}
                      </span>
                    </div>

                    <div>
                      <div className="line-clamp-1 text-xs font-black">
                        {item.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[10px] leading-5 opacity-75">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Talks */}
        {talkItems.length ? (
          <section className="space-y-3">
            <SectionHeader
              icon={<BookOpen className="h-4 w-4 text-warning" />}
              title="سخنرانی‌های مکتوب"
              meta="فیش‌های کوتاه و آماده استفاده برای منبر"
            />

            <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
              {talkItems.map((item, index) => (
                <article
                  key={item.apiId}
                  className={`flex items-center gap-3 px-3 py-3 ${
                    index !== talkItems.length - 1
                      ? "border-b border-divider"
                      : ""
                  }`}
                  dir="rtl"
                >
                  {item.authorAvatar ? (
                    <img
                      src={item.authorAvatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black text-icon"
                    >
                      {(item.author || item.title).slice(0, 1)}
                    </span>
                  )}

                  <Link
                    href={`/content/${item.id}` as Route}
                    className="min-w-0 flex-1"
                  >
                    <h4 className="truncate text-xs font-black text-foreground">
                      {item.author || item.title}
                    </h4>

                    <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                      {item.title}
                    </p>
                  </Link>

                  <Link
                    href={`/content/${item.id}` as Route}
                    className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 text-[10px] font-bold text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    فیش
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Audio */}
        {audioItem ? (
          <section className="space-y-3">
            <SectionHeader
              icon={<Music2 className="h-4 w-4 text-success" />}
              title="دم‌ها و سرودهای حماسی کشوری"
              meta="آثار صوتی منتخب برای پخش در میدان"
              action={
                <Link
                  href="/podcasts"
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand hover:underline"
                >
                  <span>مشاهده بیشتر</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
              }
            />

            <div className="flex items-center gap-3 rounded-[18px] border border-border bg-surface p-3">
              <button
                type="button"
                onClick={() => void handleAudioPlayback()}
                disabled={!audioItem.media.audioSrc}
                aria-label={
                  isAudioItemPlaying
                    ? `توقف ${audioItem.title}`
                    : `پخش ${audioItem.title}`
                }
                aria-pressed={isAudioItemPlaying}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-[background-color,transform] hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground"
              >
                {isAudioItemPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="mr-0.5 h-5 w-5 fill-current" />
                )}
              </button>

              <Link
                href={`/content/${audioItem.id}` as Route}
                className="min-w-0 flex-1 text-right"
                dir="rtl"
              >
                <h4 className="truncate text-sm font-black text-foreground">
                  {audioItem.title}
                </h4>

                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {audioItem.author
                    ? `با نوای ${audioItem.author}`
                    : audioItem.subtitle}
                  {audioItem.media.duration
                    ? ` · ${audioItem.media.duration}`
                    : ""}
                </p>
              </Link>

              <Link
                href={`/content/${audioItem.id}` as Route}
                aria-label={`جزئیات ${audioItem.title}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-icon"
              >
                <Info className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      {/* Modal */}
      {detailModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detailModal.title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-3 sm:items-center"
          onClick={() => setDetailModal(null)}
        >
          <section
            className="w-full max-w-sm rounded-[20px] border border-border bg-popover p-4 text-popover-foreground shadow-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4" dir="rtl">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-foreground">
                  {detailModal.title}
                </h2>

                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {detailModal.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailModal(null)}
                aria-label="بستن"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-icon"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
