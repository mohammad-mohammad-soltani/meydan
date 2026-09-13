"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef } from "react";
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

const fallbackBars = [26, 48, 34, 72, 42, 88, 54, 30, 66, 44, 78, 38, 62, 50];
const SKIP_SECONDS = 15;

/**
 * Full-screen player for the shared audio engine.
 *
 * The bottom bar stays the always-available control; this sheet is the
 * immersive view: big artwork, ±۱۵s, transport, seek and the running queue.
 * Escape, the minimise button, a backdrop tap and a downward swipe close it.
 */
export function NowPlayingSheet({ onClose }: { onClose: () => void }) {
  const {
    currentTrack,
    queue,
    isPlaying,
    isReady,
    currentTime,
    error,
    levels,
    hasNext,
    hasPrevious,
    toggle,
    previous,
    next,
    seekBy,
    playTrack,
  } = useAudio();

  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);

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

  if (!currentTrack) return null;

  const bars = levels.length ? levels.slice(0, fallbackBars.length) : fallbackBars;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="پخش‌کنندهٔ صوت"
      dir="rtl"
      onPointerDown={(event) => {
        dragStart.current = event.clientY;
      }}
      onPointerUp={(event) => {
        if (dragStart.current !== null && event.clientY - dragStart.current > 110) onClose();
        dragStart.current = null;
      }}
      className="fixed inset-0 z-[135] flex flex-col bg-scrim/95 text-on-solid backdrop-blur-xl"
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

        <span className="text-[11px] font-black text-on-solid/70">در حال پخش</span>

        {currentTrack.sourceHref ? (
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
          className="relative mt-2 grid aspect-square w-full max-w-[19rem] place-items-center overflow-hidden rounded-panel border border-border-strong bg-surface-glass shadow-dialog"
          style={
            currentTrack.cover
              ? {
                  backgroundImage: `url("${currentTrack.cover.replace(/"/g, "%22")}")`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          {!currentTrack.cover ? <Headphones className="h-16 w-16 text-on-solid/80" /> : null}

          <span className="absolute inset-x-6 bottom-5 flex h-16 items-end justify-center gap-1">
            {bars.map((height, index) => (
              <span
                key={index}
                className={`w-1 rounded-full bg-brand transition-[height] duration-100 ${
                  isPlaying ? "" : "opacity-60"
                }`}
                style={{ height: `${isPlaying ? height : Math.min(height, 32)}%` }}
              />
            ))}
          </span>
        </div>

        <div className="mt-5 w-full min-w-0 text-center">
          <h2 className="truncate text-lg font-black">{currentTrack.title}</h2>
          {currentTrack.artist ? (
            <p className="mt-1 truncate text-xs text-on-solid/70">{currentTrack.artist}</p>
          ) : null}
        </div>

        <div className="mt-5 w-full">
          <AudioProgressBar className="w-full" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3" dir="ltr">
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

        {error ? (
          <p role="alert" className="mt-3 text-center text-xs font-bold text-danger">
            {error}
          </p>
        ) : null}

        {queue.length > 1 ? (
          <section aria-label="صف پخش" className="mt-5 w-full min-h-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black text-on-solid/70">
              <ListMusic aria-hidden="true" className="h-3.5 w-3.5" />
              صف پخش
            </h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto no-scrollbar">
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
