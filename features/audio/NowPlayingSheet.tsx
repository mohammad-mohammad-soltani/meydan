"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { AudioTrack } from "./types";
import styles from "./audio.module.css";
import { getLevels, getServerLevels, subscribeLevels } from "./audio-analysis";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Headphones,
  ListMusic,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AudioProgressBar } from "./AudioProgressBar";
import { useAudio } from "./AudioProvider";

const SKIP_SECONDS = 15;
const EQ_BARS = Array.from({ length: 30 }, (_, i) => ({
  base: `${24 + ((i * 37) % 52)}%`,
  dur: `${(0.55 + ((i * 53) % 70) / 100).toFixed(2)}s`,
  delay: `-${(((i * 29) % 90) / 100).toFixed(2)}s`,
}));
const hueOf = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
};
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A browsable list of recordings (one speaker's, say) shown in the sheet's queue area, with infinite scroll. */
export type SheetCollection = {
  /** «صوت‌های X» */
  title: string;
  /** Portrait shown as the artwork; a letter stands in when there is none. */
  cover?: string;
  initial?: string;
  tracks: AudioTrack[];
  loading: boolean;
  hasMore: boolean;
  failed?: boolean;
  onLoadMore: () => void;
};

/**
 * Full-screen player for the shared audio engine.
 *
 * The bottom bar stays the always-available control; this sheet is the
 * immersive view: big artwork, ±۱۵s, transport, seek and the running queue.
 * Escape, the minimise button, a backdrop tap and a downward swipe close it.
 */
export function NowPlayingSheet({ onClose: closeNow, collection }: { onClose: () => void; collection?: SheetCollection }) {
  const {
    currentTrack,
    queue,
    isPlaying,
    isReady,
    currentTime,
    error,
    hasNext,
    hasPrevious,
    toggle,
    previous,
    next,
    seekBy,
    playTrack,
  } = useAudio();

  // Real spectrum of the playing file when its host allows it; otherwise the stand-in animation.
  const liveLevels = useSyncExternalStore(subscribeLevels, getLevels, getServerLevels);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  // Slides in from the bottom on open and back down before it unmounts.
  useEffect(() => {
    if (reducedMotion()) return;
    dialogRef.current?.animate(
      [{ transform: "translate3d(0,100%,0)", opacity: 0.4 }, { transform: "translate3d(0,0,0)", opacity: 1 }],
      { duration: 360, easing: EASE },
    );
  }, []);

  const shown = Boolean(currentTrack || collection);

  /** Slides the sheet away from `from` px down (0 when closed by a button) and then unmounts it. */
  const slideOut = useCallback((from: number, duration = 260) => {
    if (closing.current) return;
    closing.current = true;
    const node = dialogRef.current;
    if (!node || reducedMotion()) {
      closeNow();
      return;
    }
    node.style.transform = "";
    node.style.transition = "";
    const exit = node.animate(
      [{ transform: `translate3d(0,${from}px,0)`, opacity: 1 }, { transform: "translate3d(0,100%,0)", opacity: 0.4 }],
      { duration, easing: "cubic-bezier(0.3, 0, 0.8, 0.6)", fill: "forwards" },
    );
    exit.onfinish = closeNow;
    exit.oncancel = closeNow;
  }, [closeNow]);
  const onClose = useCallback(() => slideOut(0), [slideOut]);

  // The sheet follows the finger on a downward drag, then either leaves from where it was let go
  // or springs back. A drag that starts in the scrolling list belongs to the list.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    let start: { x: number; y: number; time: number } | null = null;
    let dragging = false;
    let offset = 0;
    let last = { y: 0, time: 0 };
    let velocity = 0;
    let settleTimer = 0;
    let base = 0;

    const onStart = (event: TouchEvent) => {
      start = null;
      dragging = false;
      base = 0;
      // A new touch takes over from a spring-back that has not finished.
      if (settleTimer) {
        window.clearTimeout(settleTimer);
        settleTimer = 0;
        // Read where it is mid-flight first: cancelling the transition snaps the computed value to its end.
        base = Math.max(0, new DOMMatrix(getComputedStyle(node).transform).m42);
        node.style.transition = "none";
        node.style.transform = `translate3d(0,${base}px,0)`;
      }
      if (event.touches.length !== 1 || closing.current) return;
      if ((event.target as HTMLElement).closest("[data-sheet-list],input,[role=slider]")) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
      last = { y: touch.clientY, time: event.timeStamp };
      velocity = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (!start || closing.current) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!dragging) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          start = null;
          return;
        }
        dragging = true;
        node.style.transition = "none";
        node.style.willChange = "transform";
      }
      if (event.cancelable) event.preventDefault();
      offset = Math.max(0, base + dy);
      node.style.transform = `translate3d(0,${offset}px,0)`;
      // Speed over the latest stretch of the drag, so a flick at the end counts and a pause does not.
      const dt = event.timeStamp - last.time;
      if (dt >= 8) {
        velocity = velocity * 0.5 + ((touch.clientY - last.y) / dt) * 0.5;
        last = { y: touch.clientY, time: event.timeStamp };
      }
    };
    const onEnd = (event: TouchEvent, cancelled = false) => {
      if (!start || !dragging) {
        start = null;
        return;
      }
      const far = !cancelled && (offset > node.clientHeight * 0.3 || (velocity > 0.5 && offset > 24));
      start = null;
      dragging = false;
      node.style.willChange = "";
      if (far) {
        slideOut(offset, Math.round(Math.min(260, Math.max(140, (node.clientHeight - offset) / Math.max(velocity, 0.9)))));
      } else {
        node.style.transition = "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)";
        node.style.transform = "translate3d(0,0,0)";
        settleTimer = window.setTimeout(() => {
          settleTimer = 0;
          node.style.transition = "";
          node.style.transform = "";
        }, 280);
      }
      offset = 0;
    };
    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    const onCancel = (event: TouchEvent) => onEnd(event, true);
    node.addEventListener("touchend", onEnd as EventListener, { passive: true });
    node.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd as EventListener);
      node.removeEventListener("touchcancel", onCancel);
      window.clearTimeout(settleTimer);
    };
  }, [slideOut, shown]);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const loadMoreRef = useRef(collection?.onLoadMore);
  loadMoreRef.current = collection?.onLoadMore;
  const canLoadMore = Boolean(collection?.hasMore && !collection.loading && !collection.failed);

  // Reading to the end of the list pulls in the next page.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root || !canLoadMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current?.();
    }, { root, rootMargin: "0px 0px 160px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, collection?.tracks.length]);

  if (!currentTrack && !collection) return null;
  const artwork = collection ? collection.cover : currentTrack?.cover;
  const inCollection = Boolean(currentTrack && collection?.tracks.some((track) => track.id === currentTrack.id));


  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="پخش‌کنندهٔ صوت"
      dir="rtl"
      // On desktop the sheet fills only the site column (the app shell publishes its box as --col-l / --col-w).
      className="fixed inset-0 z-[135] flex touch-none flex-col overscroll-none bg-[#0a0a0c] text-on-solid lg:inset-y-0 lg:left-[var(--col-l,0px)] lg:right-auto lg:w-[var(--col-w,100%)] lg:border-x lg:border-border"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 p-3">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="بستن پخش‌کنندهٔ تمام‌صفحه"
          className="grid h-11 w-11 place-items-center rounded-full bg-surface-glass/15 outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <ChevronDown aria-hidden="true" className="h-6 w-6" />
        </button>

        <span className="min-w-0 truncate text-[11px] font-black text-on-solid/70">{collection ? collection.title : "در حال پخش"}</span>

        {!collection && currentTrack?.sourceHref ? (
          <Link
            href={currentTrack.sourceHref as Route}
            onClick={onClose}
            className="rounded-pill bg-surface-glass/15 px-3 py-2 text-[11px] font-black outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            مشاهدهٔ منبع
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center px-5 pb-5">
        <div
          aria-hidden="true"
          className={`${styles.art} mt-2 grid aspect-square w-full place-items-center overflow-hidden rounded-panel border border-border-strong bg-surface-glass shadow-dialog ${collection ? "max-w-[13rem]" : "max-w-[19rem]"}`}
          style={
            artwork
              ? {
                  backgroundImage: `url("${artwork.replace(/"/g, "%22")}")`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          {!artwork ? (
            collection?.initial ? (
              <span className="relative z-[1] text-6xl font-black text-on-solid/90">{collection.initial}</span>
            ) : currentTrack ? (
              // No cover: a gradient seeded from the title that keeps drifting.
              <span
                className={styles.gradient}
                style={{ "--h1": hueOf(currentTrack.title), "--h2": (hueOf(currentTrack.title) + 48) % 360, "--h3": (hueOf(currentTrack.title) + 210) % 360 } as React.CSSProperties}
              />
            ) : (
              <Headphones className="h-16 w-16 text-on-solid/80" />
            )
          ) : null}
          {currentTrack ? (
            <>
              <span className={styles.shade} />
              {/* Bars follow the file's real spectrum; if its host does not allow reading it, they move with playback instead. */}
              <span className={styles.eq} data-playing={isPlaying && isReady ? "true" : "false"} data-live={liveLevels ? "true" : "false"}>
                {EQ_BARS.map((bar, index) => (
                  <span
                    key={index}
                    style={{
                      "--base": bar.base,
                      "--dur": bar.dur,
                      "--delay": bar.delay,
                      ...(liveLevels ? { transform: `scaleY(${(0.06 + (liveLevels[index] ?? 0) * 0.94).toFixed(3)})` } : null),
                    } as React.CSSProperties}
                  />
                ))}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-4 w-full min-w-0 text-center">
          {collection && !inCollection ? (
            <>
              <h2 className="truncate text-lg font-black">{collection.title}</h2>
              <p className="mt-1 text-xs text-on-solid/70">{collection.tracks.length ? `${new Intl.NumberFormat("fa-IR").format(collection.tracks.length)}${collection.hasMore ? "+" : ""} صوت` : collection.loading ? "در حال بارگذاری…" : "هنوز صوتی نیست"}</p>
            </>
          ) : currentTrack ? (
            <>
              <h2 className="truncate text-lg font-black">{currentTrack.title}</h2>
              {currentTrack.artist ? <p className="mt-1 truncate text-xs text-on-solid/70">{currentTrack.artist}</p> : null}
            </>
          ) : null}
        </div>

        {currentTrack ? (
        <>
        <div className="mt-4 w-full">
          <AudioProgressBar className="w-full" />
        </div>

        <div className="mt-3 flex items-center justify-center gap-3" dir="ltr">
          <button
            type="button"
            onClick={() => void previous()}
            disabled={!hasPrevious && currentTime < 1}
            aria-label="قطعهٔ قبلی"
            className="grid h-12 w-12 place-items-center rounded-full outline-none transition hover:bg-surface-glass/15 disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <SkipBack aria-hidden="true" className="h-6 w-6 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => seekBy(-SKIP_SECONDS)}
            aria-label={`${SKIP_SECONDS} ثانیه عقب`}
            className="grid h-12 w-12 place-items-center rounded-full outline-none transition hover:bg-surface-glass/15 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <RotateCcw aria-hidden="true" className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={isPlaying ? "توقف پخش" : "ادامهٔ پخش"}
            className="grid h-16 w-16 place-items-center rounded-full bg-solid-light text-on-light shadow-popover outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:hover:scale-100"
          >
            {isPlaying && !isReady ? (
              <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin motion-reduce:animate-none" />
            ) : isPlaying ? (
              <Pause aria-hidden="true" className="h-7 w-7 fill-current" />
            ) : (
              <Play aria-hidden="true" className="ml-0.5 h-7 w-7 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(SKIP_SECONDS)}
            aria-label={`${SKIP_SECONDS} ثانیه جلو`}
            className="grid h-12 w-12 place-items-center rounded-full outline-none transition hover:bg-surface-glass/15 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <RotateCw aria-hidden="true" className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => void next()}
            disabled={!hasNext}
            aria-label="قطعهٔ بعدی"
            className="grid h-12 w-12 place-items-center rounded-full outline-none transition hover:bg-surface-glass/15 disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <SkipForward aria-hidden="true" className="h-6 w-6 fill-current" />
          </button>
        </div>
        </>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-center text-xs font-bold text-danger">
            {error}
          </p>
        ) : null}

        {collection ? (
          <section aria-label="صوت‌ها" className="mt-4 flex min-h-0 w-full flex-1 flex-col">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black text-on-solid/70">
              <ListMusic aria-hidden="true" className="h-3.5 w-3.5" />
              {collection.title}
            </h3>
            <ul ref={listRef} data-sheet-list className="mt-2 min-h-0 flex-1 touch-pan-y space-y-1 overflow-y-auto overscroll-contain no-scrollbar">
              {collection.tracks.map((track, index) => {
                const active = track.id === currentTrack?.id;
                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={() => void playTrack(track, { queue: collection.tracks })}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-3 rounded-control px-3 py-2 text-right outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80 ${active ? "bg-surface-glass/20" : "hover:bg-surface-glass/10"}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-glass/15 text-[10px] font-black tabular-nums">
                        {active && isPlaying ? <Pause aria-hidden="true" className="h-3.5 w-3.5 fill-current" /> : <Play aria-hidden="true" className="ml-px h-3.5 w-3.5 fill-current" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs ${active ? "font-black" : "font-bold"}`}>{track.title}</span>
                        {track.artist ? <span className="mt-0.5 block truncate text-[10px] text-on-solid/60">{track.artist}</span> : null}
                      </span>
                      {active && isPlaying ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })}
              {collection.loading ? [0, 1, 2].map((row) => (
                <li key={`skeleton-${row}`} aria-hidden="true" className="flex items-center gap-3 px-3 py-2">
                  <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-glass/15" />
                  <span className="h-3 flex-1 animate-pulse rounded-full bg-surface-glass/15" />
                </li>
              )) : null}
              {collection.failed ? (
                <li className="py-2 text-center">
                  <button type="button" onClick={collection.onLoadMore} className="rounded-pill bg-surface-glass/15 px-4 py-2 text-[11px] font-black">دوباره تلاش کنید</button>
                </li>
              ) : null}
              {!collection.loading && !collection.tracks.length && !collection.failed ? <li className="py-8 text-center text-xs text-on-solid/60">هنوز صوتی منتشر نشده است.</li> : null}
              <li ref={sentinelRef} aria-hidden="true" className="h-px" />
            </ul>
          </section>
        ) : queue.length > 1 && currentTrack ? (
          <section aria-label="صف پخش" className="mt-5 w-full min-h-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black text-on-solid/70">
              <ListMusic aria-hidden="true" className="h-3.5 w-3.5" />
              صف پخش
            </h3>
            <ul data-sheet-list className="mt-2 max-h-48 touch-pan-y space-y-1 overflow-y-auto overscroll-contain no-scrollbar">
              {queue.map((track, index) => {
                const active = track.id === currentTrack.id;
                return (
                  <li key={`${track.id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => void playTrack(track, { queue })}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-3 rounded-control px-3 py-2 text-right outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80 ${
                        active ? "bg-surface-glass/20" : "hover:bg-surface-glass/10"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-glass/15 text-[10px] font-black tabular-nums">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs ${active ? "font-black" : "font-bold"}`}>
                          {track.title}
                        </span>
                        {track.artist ? (
                          <span className="mt-0.5 block truncate text-[10px] text-on-solid/60">{track.artist}</span>
                        ) : null}
                      </span>
                      {active && isPlaying ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <span
          aria-hidden="true"
          className="mt-3 h-1 w-12 shrink-0 rounded-full bg-on-solid/25"
        />
        <span className="sr-only">برای بستن، به پایین بکشید.</span>
      </div>
    </div>,
    document.body,
  );
}
