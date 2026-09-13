"use client";

import Link from "next/link";
import type { Route } from "next";
import { Headphones, LoaderCircle, Music2, Pause, Play, Search, X } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/features/audio/AudioProvider";
import type { ContentItem } from "@/features/content/types";
import { filterPodcastItems } from "../search";

export function PodcastsView({ items }: { items: ContentItem[] }) {
  const [query, setQuery] = useState("");
  const filteredItems = filterPodcastItems(items, query);

  return (
    <section
      className="min-h-full bg-background pb-24 text-foreground"
      aria-labelledby="podcasts-title"
      dir="rtl"
    >
      <header className="sticky top-0 z-20 border-b border-divider bg-surface-glass px-4 py-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-surface text-success">
            <Music2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 id="podcasts-title" className="text-base font-black text-foreground">
              دم‌ها و سرودهای حماسی کشوری
            </h1>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              همه آثار صوتی آماده پخش در میدان
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-icon-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجو در عنوان، توضیحات یا نام اجراکننده…"
            aria-label="جست‌وجوی آثار صوتی"
            className="h-11 w-full rounded-control border border-input-border bg-input pr-10 pl-10 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-foreground-subtle focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="پاک کردن جست‌وجو"
              className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-icon"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-[10px] font-bold text-muted-foreground">
          {filteredItems.length.toLocaleString("fa-IR")} اثر
        </p>
      </header>

      <div className="space-y-2.5 px-3 py-4 sm:px-4">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <div
              key={item.apiId}
              className="group flex items-center gap-3 rounded-[16px] border border-border bg-surface p-3 transition-[background-color,border-color,transform] hover:border-border-strong hover:bg-hover active:scale-[0.99]"
            >
              <Link
                href={`/content/${item.id}` as Route}
                className="flex min-w-0 flex-1 items-center gap-3 text-right outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success-surface text-success transition-transform group-hover:scale-105">
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                    {item.author ? `${item.author} · ` : ""}
                    {item.subtitle || item.description}
                  </p>
                </div>
              </Link>

              {item.media.duration ? (
                <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold text-foreground-secondary">
                  {item.media.duration}
                </span>
              ) : null}

              <PodcastPlayButton item={item} />
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-border bg-surface-muted px-5 py-10 text-center">
            <Search className="mx-auto h-6 w-6 text-icon-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-black text-foreground">
              نتیجه‌ای پیدا نشد
            </p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              عبارت دیگری برای جست‌وجو امتحان کنید.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Starts the shared bottom player without leaving the catalogue. */
function PodcastPlayButton({ item }: { item: ContentItem }) {
  const { currentTrack, isPlaying, isReady, playTrack, toggle } = useAudio();
  const url = item.media.audioSrc;
  const trackId = `podcast:${item.apiId}`;
  const isCurrent = Boolean(url && currentTrack?.id === trackId);
  const activePlaying = isCurrent && isPlaying;

  const togglePlayback = async () => {
    if (!url) return;
    if (isCurrent) await toggle();
    else
      await playTrack({
        id: trackId,
        title: item.title,
        artist: item.author,
        cover: item.media.coverImage,
        url,
        sourceHref: `/content/${item.id}`,
      });
  };

  return (
    <button
      type="button"
      onClick={() => void togglePlayback()}
      disabled={!url}
      aria-label={activePlaying ? `توقف پخش ${item.title}` : `پخش ${item.title}`}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:scale-100"
    >
      {activePlaying && !isReady ? (
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : activePlaying ? (
        <Pause aria-hidden="true" className="h-4 w-4 fill-current" />
      ) : (
        <Play aria-hidden="true" className="ms-0.5 h-4 w-4 fill-current" />
      )}
    </button>
  );
}
