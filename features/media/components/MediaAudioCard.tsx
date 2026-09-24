"use client";

import { useMemo } from "react";
import { Headphones, LoaderCircle, Pause, Play } from "lucide-react";
import { useAudio } from "@/features/audio/AudioProvider";
import { formatClock, mediaThumbnailSrc } from "../media-utils";
import type { MediaItem } from "../types";

const fallbackBars = [30, 55, 40, 78, 48, 88, 60, 34, 70, 45, 82, 52];

type MediaAudioCardProps = {
  item: MediaItem;
  /** Namespace for the track id so the same file keeps one identity per surface. */
  scope: string;
  artist?: string;
  cover?: string;
  /** `bubble` matches chat bubbles; `surface` matches feed/post/content cards. */
  tone?: "surface" | "bubble";
};

/**
 * The one audio attachment card. Playback is delegated to the shared audio
 * engine, so pressing play anywhere starts the same bottom player and every
 * card mirrors its live state (progress, levels, error).
 */
export function MediaAudioCard({
  item,
  scope,
  artist,
  cover,
  tone = "surface",
}: MediaAudioCardProps) {
  const { currentTrack, currentTime, duration, isPlaying, isReady, levels, error, playTrack, toggle } =
    useAudio();

  const track = useMemo(
    () =>
      item.src
        ? {
            id: `${scope}:${item.id}`,
            title: item.title,
            artist,
            cover: mediaThumbnailSrc(cover, 128),
            url: item.src,
          }
        : null,
    [artist, cover, item.id, item.src, item.title, scope],
  );

  const isCurrent = Boolean(track && currentTrack?.id === track.id);
  const activePlaying = isCurrent && isPlaying;
  const activeTime = isCurrent ? currentTime : 0;
  const activeDuration = isCurrent ? duration : 0;
  const progress = activeDuration > 0 ? Math.min(1, Math.max(0, activeTime / activeDuration)) : 0;
  const bars = isCurrent && levels.length ? levels.slice(0, fallbackBars.length) : fallbackBars;

  const togglePlayback = async () => {
    if (!track) return;
    if (isCurrent) await toggle();
    else await playTrack(track);
  };

  return (
    <div
      data-media-interactive
      onClick={(event) => event.stopPropagation()}
      className={
        tone === "bubble"
          ? "mb-1.5 flex min-w-[240px] items-center gap-3 rounded-xl bg-active p-2.5"
          : "mt-2.5 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
      }
    >
      <button
        type="button"
        onClick={() => void togglePlayback()}
        disabled={!track}
        aria-label={activePlaying ? "توقف پخش صوت" : "پخش صوت"}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
          tone === "bubble"
            ? "bg-surface-glass text-foreground"
            : "bg-brand text-brand-foreground shadow-sm"
        }`}
      >
        {activePlaying && !isReady ? (
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : activePlaying ? (
          <Pause aria-hidden="true" className="h-5 w-5 fill-current" />
        ) : (
          <Play aria-hidden="true" className="ml-0.5 h-5 w-5 fill-current" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <Headphones
            aria-hidden="true"
            className={`h-3.5 w-3.5 shrink-0 ${tone === "bubble" ? "opacity-70" : "text-brand"}`}
          />
          <strong className="truncate text-xs font-black">{item.title}</strong>
        </div>

        {isCurrent ? (
          <div className="mt-1.5 flex items-center gap-2">
            {activePlaying ? (
              <span aria-hidden="true" className="flex h-4 items-end gap-[2px]">
                {bars.map((height, index) => (
                  <span
                    key={index}
                    className={`w-[2px] rounded-full transition-[height] duration-100 ${
                      tone === "bubble" ? "bg-current opacity-70" : "bg-brand"
                    }`}
                    style={{ height: `${Math.max(12, height)}%` }}
                  />
                ))}
              </span>
            ) : null}
            <span dir="ltr" className="shrink-0 text-[10px] tabular-nums opacity-70">
              {formatClock(activeTime)} / {activeDuration > 0 ? formatClock(activeDuration) : "--:--"}
            </span>
            <span
              aria-hidden="true"
              className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted"
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${tone === "bubble" ? "bg-current opacity-70" : "bg-brand"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </span>
          </div>
        ) : (
          <p className="mt-0.5 truncate text-[10px] opacity-70">
            {item.detail || "پخش در پخش‌کنندهٔ پایین صفحه"}
          </p>
        )}

        {isCurrent && error ? (
          <p role="alert" className="mt-1 text-[10px] font-bold text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
