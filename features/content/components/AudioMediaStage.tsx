"use client";

import { Headphones, LoaderCircle, Pause, Play } from "lucide-react";
import { useEffect, useMemo } from "react";
import { AudioProgressBar, formatAudioTime } from "@/features/audio/AudioProgressBar";
import { useAudio } from "@/features/audio/AudioProvider";
import type { ContentDetailItem } from "../types";

type AudioMediaStageProps = {
  item: ContentDetailItem;
  isPlaying: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
};

const fallbackBars = [
  25, 42, 68, 38, 76, 48, 86, 55, 34, 72, 46, 90, 62, 37, 70, 45, 82,
  52, 31, 64, 44, 74, 36, 58,
];

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function parseDuration(value?: string): number | undefined {
  if (!value) return undefined;
  const parts = normalizeDigits(value)
    .trim()
    .split(":")
    .map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return undefined;
  }

  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return seconds > 0 ? seconds : undefined;
}

export function AudioMediaStage({
  item,
  onPlayingChange,
}: AudioMediaStageProps) {
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    isReady,
    levels,
    error,
    playTrack,
    toggle,
  } = useAudio();

  const audioSrc = item.media.audioSrc;
  const durationHint = useMemo(() => parseDuration(item.media.duration), [item.media.duration]);
  const track = useMemo(
    () =>
      audioSrc
        ? {
            id: `content:${item.apiId}`,
            title: item.title,
            artist: item.creator.name || item.author,
            cover: item.media.coverImage,
            url: audioSrc,
            duration: durationHint,
            sourceHref: `/content/${item.id}`,
          }
        : null,
    [
      audioSrc,
      durationHint,
      item.apiId,
      item.author,
      item.creator.name,
      item.id,
      item.media.coverImage,
      item.title,
    ],
  );

  const isCurrentTrack = Boolean(track && currentTrack?.id === track.id);
  const activePlaying = isCurrentTrack && isPlaying;
  const activeCurrentTime = isCurrentTrack ? currentTime : 0;
  const activeDuration = isCurrentTrack ? duration : (durationHint ?? 0);
  const progress =
    activeDuration > 0 ? Math.min(1, Math.max(0, activeCurrentTime / activeDuration)) : 0;
  const bars = isCurrentTrack && levels.length ? levels : fallbackBars;

  useEffect(() => {
    onPlayingChange(activePlaying);
  }, [activePlaying, onPlayingChange]);

  const togglePlayback = async () => {
    if (!track) {
      onPlayingChange(false);
      return;
    }

    if (isCurrentTrack) await toggle();
    else await playTrack(track);
  };

  return (
    <div className="relative overflow-hidden bg-solid-dark px-5 py-9 text-on-solid">
      <div
        className="absolute -left-20 -top-20 h-64 w-64 rounded-full border-[36px] border-border opacity-20"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl border border-border-strong bg-surface-glass shadow-dialog backdrop-blur">
          <Headphones aria-hidden="true" className="h-7 w-7" />
        </span>
        <p className="mt-4 text-xs font-bold text-brand">پیش‌نمایش صوت</p>
        <p className="mt-1 max-w-sm text-base font-black leading-7">{item.title}</p>

        <div
          className="mt-6 flex h-16 w-full items-center justify-center gap-1"
          aria-hidden="true"
        >
          {bars.slice(0, fallbackBars.length).map((height, index) => (
            <span
              key={index}
              className={`w-1 rounded-full transition-[height,background-color] duration-100 ${
                index / fallbackBars.length <= progress || activePlaying
                  ? "bg-brand"
                  : "bg-surface-glass"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {isCurrentTrack ? (
          <AudioProgressBar className="mt-3 w-full" />
        ) : (
          <div className="mt-3 flex w-full items-center gap-3" dir="ltr">
            <span className="w-11 text-left text-[11px] tabular-nums text-on-solid/70">
              0:00
            </span>
            <div
              aria-label="موقعیت پخش صوت"
              aria-disabled="true"
              className="relative h-7 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-glass" />
            </div>
            <span className="w-11 text-right text-[11px] tabular-nums text-on-solid/70">
              {durationHint ? formatAudioTime(durationHint) : (item.media.duration || "--:--")}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => void togglePlayback()}
          disabled={!track}
          aria-label={activePlaying ? "توقف پیش‌نمایش صوت" : "پخش پیش‌نمایش صوت"}
          className="mt-5 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-solid-light text-on-light shadow-popover outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-solid-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {activePlaying && !isReady ? (
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          ) : activePlaying ? (
            <Pause aria-hidden="true" className="h-6 w-6 fill-current" />
          ) : (
            <Play aria-hidden="true" className="mr-0.5 h-6 w-6 fill-current" />
          )}
        </button>

        {!track ? (
          <p role="alert" className="mt-3 max-w-sm text-xs leading-6 text-danger">
            فایل صوتی برای این محتوا در دسترس نیست.
          </p>
        ) : isCurrentTrack && error ? (
          <p role="alert" className="mt-3 max-w-sm text-xs leading-6 text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
