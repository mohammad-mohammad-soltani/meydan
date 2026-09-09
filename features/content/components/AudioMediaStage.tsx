"use client";

import { Headphones, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
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

function formatTime(value: number): string {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioMediaStage({
  item,
  isPlaying,
  onPlayingChange,
}: AudioMediaStageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [playbackError, setPlaybackError] = useState("");

  const audioSrc = item.media.audioSrc;
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const bars = levels.length ? levels : fallbackBars;

  const startAnalyserLoop = (analyser: AnalyserNode) => {
    if (frameRef.current !== null) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevels(
        Array.from(data.slice(0, 24), (value) =>
          Math.max(12, Math.round((value / 255) * 100)),
        ),
      );
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const ensureAudioGraph = async () => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    let context = audioContextRef.current;
    let analyser = analyserRef.current;

    if (!context || !analyser) {
      context = new AudioContextClass();
      analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.78;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceRef.current = source;
      startAnalyserLoop(analyser);
    }

    if (context.state !== "running") {
      await context.resume();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    setCurrentTime(0);
    setDuration(0);
    setPlaybackError("");

    const syncTime = () => setCurrentTime(audio.currentTime || 0);
    const syncDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handlePlay = () => {
      setPlaybackError("");
      onPlayingChange(true);
    };
    const handlePause = () => onPlayingChange(false);
    const handleEnded = () => {
      syncTime();
      onPlayingChange(false);
    };
    const handleError = () => {
      setPlaybackError("پخش فایل صوتی ممکن نشد. اتصال فایل یا پاسخ سرور را بررسی کنید.");
      onPlayingChange(false);
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioSrc, onPlayingChange]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      sourceRef.current = null;
      analyserRef.current = null;

      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) {
      setPlaybackError("فایل صوتی برای این محتوا در دسترس نیست.");
      onPlayingChange(false);
      return;
    }

    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    setPlaybackError("");

    try {
      // Web Audio must be resumed from the user's interaction. Creating the
      // MediaElementSource on mount can leave the graph suspended and mute an
      // otherwise successfully playing <audio> element.
      await ensureAudioGraph();
    } catch {
      // The analyser is progressive enhancement. If Web Audio is unavailable
      // or blocked, keep the native audio element usable instead of muting it.
    }

    try {
      await audio.play();
    } catch {
      setPlaybackError("مرورگر نتوانست پخش صوت را شروع کند. دوباره تلاش کنید.");
      onPlayingChange(false);
    }
  };

  const setAudioTime = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const clamped = Math.max(0, Math.min(duration, nextTime));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    setAudioTime(ratio * duration);
  };

  const seekWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setAudioTime(currentTime + 5);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setAudioTime(currentTime - 5);
    } else if (event.key === "Home") {
      event.preventDefault();
      setAudioTime(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setAudioTime(duration);
    }
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
              className={`w-1 rounded-full ${
                index / bars.length <= progress || isPlaying
                  ? "bg-brand"
                  : "bg-surface-glass"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="mt-3 flex w-full items-center gap-3" dir="ltr">
          <span className="w-9 text-left text-[11px] tabular-nums text-on-solid/70">
            {formatTime(currentTime)}
          </span>
          <div
            role="slider"
            aria-label="موقعیت پخش صوت"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
            tabIndex={0}
            onClick={seek}
            onKeyDown={seekWithKeyboard}
            className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-surface-glass outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="w-9 text-right text-[11px] tabular-nums text-on-solid/70">
            {duration ? formatTime(duration) : item.media.duration}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void togglePlayback()}
          disabled={!audioSrc}
          aria-label={isPlaying ? "توقف پیش‌نمایش صوت" : "پخش پیش‌نمایش صوت"}
          className="mt-5 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-solid-light text-on-light shadow-popover outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-solid-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPlaying ? (
            <Pause aria-hidden="true" className="h-6 w-6 fill-current" />
          ) : (
            <Play aria-hidden="true" className="mr-0.5 h-6 w-6 fill-current" />
          )}
        </button>

        {playbackError ? (
          <p role="alert" className="mt-3 max-w-sm text-xs leading-6 text-danger">
            {playbackError}
          </p>
        ) : null}

        {audioSrc ? (
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            aria-label={item.title}
            className="hidden"
          />
        ) : null}
      </div>
    </div>
  );
}
