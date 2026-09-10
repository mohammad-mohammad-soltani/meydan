"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Headphones,
  LoaderCircle,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AudioProgressBar, formatAudioTime } from "./AudioProgressBar";
import { useAudio } from "./AudioProvider";

const fallbackBars = [24, 52, 36, 74, 42, 88, 56, 32, 64, 46, 78, 40, 68, 50];

export function MiniPlayer() {
  const pathname = usePathname();
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    isReady,
    levels,
    error,
    hasNext,
    hasPrevious,
    toggle,
    next,
    previous,
    clear,
  } = useAudio();

  if (!currentTrack) return null;

  // The content detail route already renders the full-size player. The global
  // engine keeps running there; only the duplicate mini UI is hidden.
  const isFullPlayerRoute =
    Boolean(currentTrack.sourceHref) &&
    pathname.startsWith("/content/") &&
    pathname === currentTrack.sourceHref;
  if (isFullPlayerRoute) return null;

  const bars = levels.length ? levels.slice(0, fallbackBars.length) : fallbackBars;
  const trackBody = (
    <>
      <strong className="line-clamp-1  text-[12px] w-full font-black text-foreground">
        {currentTrack.title}
      </strong>
      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground" dir="ltr">
        <span className="tabular-nums">
          {formatAudioTime(currentTime)} / {duration > 0 ? formatAudioTime(duration) : "--:--"}
        </span>
        {currentTrack.artist ? (
          <>
            <span aria-hidden="true">•</span>
            <span className="max-w-28 truncate" dir="rtl">{currentTrack.artist}</span>
          </>
        ) : null}
      </span>
    </>
  );

  return (
    <section
      aria-label="پخش‌کننده صوت"
      className="relative z-50 shrink-0 border-t border-border bg-surface-glass px-3 py-2.5 text-foreground shadow-popover backdrop-blur-md"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-muted text-brand"
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
          {!currentTrack.cover ? <Headphones aria-hidden="true" className="h-5 w-5" /> : null}
          <div className="absolute inset-x-1.5 bottom-1 flex h-3 items-end justify-center gap-px" aria-hidden="true">
            {bars.map((height, index) => (
              <span
                key={index}
                className={`w-0.5 rounded-full bg-brand ${isPlaying ? "" : "opacity-50"}`}
                style={{ height: `${isPlaying ? height : Math.min(height, 34)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {currentTrack.sourceHref ? (
            <Link
              href={currentTrack.sourceHref as Route}
              className="block min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {trackBody}
            </Link>
          ) : (
            <div className="min-w-0">{trackBody}</div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5" dir="ltr">
          <button
            type="button"
            onClick={clear}
            aria-label="بستن پخش‌کننده"
            title="بستن پخش‌کننده"
            className="grid h-9 w-9 place-items-center rounded-full text-icon-muted outline-none transition hover:bg-hover hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => void previous()}
            disabled={!hasPrevious && currentTime < 1}
            aria-label="قطعه قبلی"
            className="grid h-9 w-9 place-items-center rounded-full text-icon-muted outline-none transition hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SkipBack aria-hidden="true" className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={isPlaying ? "توقف پخش" : "ادامه پخش"}
            className="grid h-11 w-11 place-items-center rounded-full bg-brand text-brand-foreground shadow-card outline-none transition hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isPlaying && !isReady ? (
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause aria-hidden="true" className="h-5 w-5 fill-current" />
            ) : (
              <Play aria-hidden="true" className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => void next()}
            disabled={!hasNext}
            aria-label="قطعه بعدی"
            className="grid h-9 w-9 place-items-center rounded-full text-icon-muted outline-none transition hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SkipForward aria-hidden="true" className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>

      <AudioProgressBar compact showTimes={false} className="mt-1" />

      {error ? (
        <p role="alert" className="mt-1 line-clamp-1 text-[10px] font-bold text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
