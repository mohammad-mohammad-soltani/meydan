"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { LoaderCircle, Maximize2, Pause, Play, Video, Volume2, VolumeX } from "lucide-react";
import type { FeedAttachment } from "../../types";
import { formatClock, mediaAspectRatio, resolveMediaDuration } from "./media-utils";

/**
 * Inline video player: tap to play/pause, scrubbable progress, mute and
 * fullscreen. The visible controls fade out while playing so the picture stays
 * the focus, and reappear on hover, focus or while seeking.
 */
export function InlineVideoPlayer({
  attachment,
  className = "",
}: {
  attachment: FeedAttachment;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const seekingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(() =>
    mediaAspectRatio(attachment.width, attachment.height),
  );

  const source = attachment.previewSrc;
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const syncDuration = (video: HTMLVideoElement) => {
    const resolved = resolveMediaDuration(video);
    if (resolved > 0) setDuration(resolved);
    return resolved;
  };

  const syncVideoMetrics = (video: HTMLVideoElement) => {
    syncDuration(video);

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(mediaAspectRatio(video.videoWidth, video.videoHeight));
    }

    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setIsMuted(video.muted);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (video.paused || video.ended) {
      try {
        await video.play();
      } catch {
        setHasError(true);
      }
      return;
    }

    video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seekTo = (nextTime: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    const clamped = Math.min(resolvedDuration, Math.max(0, nextTime));

    try {
      video.currentTime = clamped;
      setCurrentTime(clamped);
    } catch {
      // Some browsers can briefly reject seeks before metadata is ready.
    }
  };

  const seekFromClientX = (clientX: number) => {
    const track = progressRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    seekTo(ratio * resolvedDuration);
  };

  const finishSeeking = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!seekingRef.current) return;

    seekFromClientX(event.clientX);
    seekingRef.current = false;
    setIsSeeking(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (wrapper.requestFullscreen) {
        await wrapper.requestFullscreen();
        return;
      }

      const iosVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      iosVideo.webkitEnterFullscreen?.();
    } catch {
      // Fullscreen availability differs between browsers; playback continues regardless.
    }
  };

  if (!source) return null;

  return (
    <div
      ref={wrapperRef}
      data-media-interactive
      className={`group/video pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm ${className}`}
      style={{ aspectRatio }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        void toggleFullscreen();
      }}
    >
      <video
        ref={videoRef}
        src={source}
        playsInline
        preload="metadata"
        aria-label={attachment.label || "پخش ویدیو"}
        className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void togglePlayback();
        }}
        onLoadedMetadata={(event) => syncVideoMetrics(event.currentTarget)}
        onLoadedData={(event) => syncVideoMetrics(event.currentTarget)}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onProgress={(event) => syncDuration(event.currentTarget)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          syncDuration(video);
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsWaiting(false);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={(event) => {
          const video = event.currentTarget;
          const resolvedDuration = syncDuration(video);
          setIsPlaying(false);
          setCurrentTime(resolvedDuration || video.currentTime || 0);
        }}
        onWaiting={() => setIsWaiting(true)}
        onCanPlay={(event) => {
          setIsWaiting(false);
          syncVideoMetrics(event.currentTarget);
        }}
        onPlaying={(event) => {
          setIsWaiting(false);
          syncDuration(event.currentTarget);
        }}
        onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsWaiting(false);
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
      />

      {isWaiting && !hasError ? (
        <span className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-sm">
            <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />
          </span>
        </span>
      ) : null}

      {!isPlaying && !isWaiting && !hasError ? (
        <button
          type="button"
          aria-label="پخش ویدیو"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void togglePlayback();
          }}
          className="absolute inset-0 z-30 m-auto grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      ) : null}

      {!hasError ? (
        <div
          dir="ltr"
          className={`absolute inset-x-0 bottom-0 z-40 px-3 pb-2.5 pt-7 transition-opacity duration-200 ${
            isPlaying && !isSeeking
              ? "opacity-0 group-hover/video:opacity-100 group-focus-within/video:opacity-100"
              : "opacity-100"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label="موقعیت پخش ویدیو"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            className="relative mb-2 h-5 w-full cursor-pointer touch-none select-none focus-visible:outline-none"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              seekingRef.current = true;
              setIsSeeking(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              seekFromClientX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (!seekingRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              seekFromClientX(event.clientX);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              event.stopPropagation();
              finishSeeking(event);
            }}
            onPointerCancel={(event) => {
              event.stopPropagation();
              seekingRef.current = false;
              setIsSeeking(false);

              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onKeyDown={(event) => {
              if (duration <= 0) return;

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                seekTo(currentTime - 5);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                seekTo(currentTime + 5);
              } else if (event.key === "Home") {
                event.preventDefault();
                seekTo(0);
              } else if (event.key === "End") {
                event.preventDefault();
                seekTo(duration);
              }
            }}
          >
            <span className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/35" />
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
            <span
              className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-opacity ${
                isSeeking ? "opacity-100" : "opacity-0 group-hover/video:opacity-100"
              }`}
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex h-8 items-center gap-2 text-white">
            <button
              type="button"
              aria-label={isPlaying ? "توقف موقت ویدیو" : "پخش ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void togglePlayback();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="h-[18px] w-[18px] fill-current" />
              ) : (
                <Play aria-hidden="true" className="ml-0.5 h-[18px] w-[18px] fill-current" />
              )}
            </button>

            <span className="shrink-0 text-[12px] font-medium tabular-nums text-white/95">
              {formatClock(currentTime)} / {formatClock(duration)}
            </span>

            <span className="min-w-0 flex-1" />

            <button
              type="button"
              aria-label={isMuted ? "فعال کردن صدای ویدیو" : "بی‌صدا کردن ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleMute();
              }}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:grid"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>

            <button
              type="button"
              aria-label="نمایش تمام‌صفحه"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void toggleFullscreen();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Maximize2 aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black px-6 text-center text-white">
          <div>
            <Video aria-hidden="true" className="mx-auto h-7 w-7" />
            <p className="mt-2 text-sm font-bold">پخش ویدیو ممکن نشد</p>
            <p className="mt-1 text-xs text-white/65">
              فایل ویدیو در دسترس نیست یا مرورگر نتوانست آن را پخش کند.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
