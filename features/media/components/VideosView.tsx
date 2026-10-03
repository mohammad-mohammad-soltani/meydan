"use client";

import { LoaderCircle, Play, SquarePlay } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { scanVideoPages, videoFeedQuery, type VideoFeedEntry, type VideoPageState } from "../video-feed-queue";
import { useVideoFeed } from "./VideoFeedProvider";
import { VideosGridSkeleton } from "./VideosGridSkeleton";

/**
 * «چندرسانه‌ای»: every video narrative in a grid; a tap opens the full-screen
 * viewer on that video with the rest of the page as its queue.
 */
export function VideosView() {
  const openFeed = useVideoFeed();
  const [entries, setEntries] = useState<VideoFeedEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const stateRef = useRef<VideoPageState>({ cursor: null, exhausted: false, recovered: false });
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (known: VideoFeedEntry[]) => {
    try {
      const { state, queue } = await scanVideoPages(stateRef.current, known, (cursor) => getFeedPage(videoFeedQuery(cursor)));
      stateRef.current = state;
      setEntries(queue);
      setError(false);
    } catch {
      setError(true);
      setEntries((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    // The first page is read on mount, once.
    void load([]);
  }, [load]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !entries?.length) return;
    const observer = new IntersectionObserver(
      ([hit]) => {
        if (!hit.isIntersecting || stateRef.current.exhausted) return;
        setLoadingMore(true);
        void load(entries).finally(() => setLoadingMore(false));
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [entries, load]);

  return (
    <section className="min-h-full pb-24" aria-labelledby="videos-title">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-divider bg-surface-glass px-4 py-3 backdrop-blur-md">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-muted text-brand">
          <SquarePlay aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h1 id="videos-title" className="text-base font-black text-foreground">چندرسانه‌ای</h1>
          <p className="text-xs text-muted-foreground">ویدیوها و ریلزهای میادین</p>
        </div>
      </header>

      {entries === null ? (
        <VideosGridSkeleton />
      ) : entries.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
          {error ? "دریافت ویدیوها ممکن نشد. دوباره تلاش کنید." : "هنوز ویدیویی منتشر نشده است."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 p-1.5 sm:grid-cols-3">
          {entries.map((entry, index) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => openFeed?.({ entry, candidates: entries.slice(index + 1) })}
              aria-label={`پخش ویدیو از ${entry.author}`}
              className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-surface-sunken text-right outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {entry.item.poster ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote poster of unknown size
                <img src={entry.item.poster} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <video src={entry.item.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              )}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <span aria-hidden="true" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
                <Play className="h-3.5 w-3.5" />
              </span>
              <span className="absolute inset-x-2.5 bottom-2.5 text-white">
                <b className="block truncate text-xs font-black">{entry.author}</b>
                {entry.body ? <span className="mt-0.5 line-clamp-2 block text-[11px] leading-5 text-white/85">{entry.body}</span> : null}
              </span>
            </button>
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-8" />
      {loadingMore ? <LoaderCircle aria-label="در حال دریافت" className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : null}
    </section>
  );
}
