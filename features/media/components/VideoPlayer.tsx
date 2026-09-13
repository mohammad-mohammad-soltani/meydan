"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  LoaderCircle,
  Maximize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaItem } from "../types";
import {
  clamp,
  faDigits,
  formatClock,
  mediaAspectRatio,
  resolveBufferedEnd,
  resolveMediaDuration,
} from "../media-utils";

const SKIP_SECONDS = 10;
const RATES = [1, 1.25, 1.5, 2];

function subscribeToNothing() {
  return () => {};
}

/** Support is read as an external store so SSR and hydration agree on `false`. */
function pictureInPictureSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    Boolean(document.pictureInPictureEnabled) &&
    typeof HTMLVideoElement !== "undefined" &&
    "requestPictureInPicture" in HTMLVideoElement.prototype
  );
}

type VideoPlayerProps = {
  item: MediaItem;
  /** `inline` keeps the card frame; `immersive` fills the lightbox stage. */
  variant?: "inline" | "immersive";
  autoPlay?: boolean;
  className?: string;
};

/**
 * The one video player for the whole app (feed, post, content, chat, lightbox).
 *
 * Tap to play/pause, ±۱۰s skip, scrubbable progress with a buffered track,
 * mute, playback rate, picture-in-picture and fullscreen. Controls fade while
 * playing so the picture stays the focus and return on hover, focus or seek.
 */
export function VideoPlayer({
  item,
  variant = "inline",
  autoPlay = false,
  className = "",
}: VideoPlayerProps) {
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
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState(1);
  const canPictureInPicture = useSyncExternalStore(
    subscribeToNothing,
    pictureInPictureSupported,
    () => false,
  );
  const [aspectRatio, setAspectRatio] = useState(() => mediaAspectRatio(item.width, item.height));

  const source = item.src;
  const progress = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const bufferedProgress = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;

  const syncDuration = (video: HTMLVideoElement) => {
    const resolved = resolveMediaDuration(video);
    if (resolved > 0) setDuration(resolved);
    return resolved;
  };

  const syncVideoMetrics = (video: HTMLVideoElement) => {
    syncDuration(video);
    setBuffered(resolveBufferedEnd(video));

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(mediaAspectRatio(video.videoWidth, video.videoHeight));
    }

    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setIsMuted(video.muted);
    setRate(video.playbackRate || 1);
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

    const clamped = clamp(nextTime, 0, resolvedDuration);

    try {
      video.currentTime = clamped;
      setCurrentTime(clamped);
    } catch {
      // Some browsers can briefly reject seeks before metadata is ready.
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    seekTo(clamp((Number.isFinite(video.currentTime) ? video.currentTime : 0) + seconds, 0, resolvedDuration));
  };

  const seekFromClientX = (clientX: number) => {
    const track = progressRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    const resolvedDuration = syncDuration(video) || duration;
    if (resolvedDuration <= 0) return;

    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
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

  const cycleRate = () => {
    const video = videoRef.current;
    if (!video) return;

    const next = RATES[(RATES.indexOf(video.playbackRate) + 1) % RATES.length] ?? 1;
    video.playbackRate = next;
    setRate(next);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      await video.requestPictureInPicture();
    } catch {
      // Picture-in-picture is optional; playback continues either way.
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

  const isImmersive = variant === "immersive";

  return (
    <div
      ref={wrapperRef}
      data-media-controls
      tabIndex={0}
      role="group"
      aria-label={item.title || "پخش‌کننده ویدیو"}
      className={`group/video pointer-events-auto relative overflow-hidden bg-black outline-none ${
        isImmersive
          ? "h-full w-full"
          : `w-full rounded-2xl border border-border shadow-sm ${className}`
      }`}
      style={isImmersive ? undefined : { aspectRatio }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();

        // X-style double tap: rewind on the left side, fast-forward on the right.
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect || rect.width <= 0) {
          void toggleFullscreen();
          return;
        }

        const ratio = (event.clientX - rect.left) / rect.width;
        if (ratio <= 0.34) {
          skip(-SKIP_SECONDS);
          return;
        }
        if (ratio >= 0.66) {
          skip(SKIP_SECONDS);
          return;
        }

        void toggleFullscreen();
      }}
      onPointerDown={() => wrapperRef.current?.focus({ preventScroll: true })}
      onKeyDown={(event) => {
        const key = event.key;
        if (key === " " || key === "k" || key === "K") {
          event.preventDefault();
          void togglePlayback();
          return;
        }
        if (key === "ArrowLeft") {
          event.preventDefault();
          skip(-SKIP_SECONDS);
          return;
        }
        if (key === "ArrowRight") {
          event.preventDefault();
          skip(SKIP_SECONDS);
          return;
        }
        if (key === "m" || key === "M") {
          event.preventDefault();
          toggleMute();
          return;
        }
        if (key === "f" || key === "F") {
          event.preventDefault();
          void toggleFullscreen();
        }
      }}
    >
      <video
        ref={videoRef}
        src={source}
        poster={item.poster}
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        aria-label={item.title || "ویدیو"}
        className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void togglePlayback();
        }}
        onLoadedMetadata={(event) => syncVideoMetrics(event.currentTarget)}
        onLoadedData={(event) => syncVideoMetrics(event.currentTarget)}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onProgress={(event) => {
          setBuffered(resolveBufferedEnd(event.currentTarget));
          syncDuration(event.currentTarget);
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          setBuffered(resolveBufferedEnd(video));
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
        onRateChange={(event) => setRate(event.currentTarget.playbackRate || 1)}
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
                event.stopPropagation();
                skip(-SKIP_SECONDS);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                event.stopPropagation();
                skip(SKIP_SECONDS);
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
              className="pointer-events-none absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/25"
              style={{ width: `${bufferedProgress}%` }}
            />
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
            <span
              className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-opacity ${
                isSeeking ? "opacity-100" : "opacity-0 group-hover/video:opacity-100 group-focus-within/video:opacity-100"
              }`}
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex h-8 items-center gap-1.5 text-white">
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

            <button
              type="button"
              aria-label={`${faDigits(String(SKIP_SECONDS))} ثانیه عقب`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                skip(-SKIP_SECONDS);
              }}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:grid"
            >
              <RotateCcw aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              aria-label={`${faDigits(String(SKIP_SECONDS))} ثانیه جلو`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                skip(SKIP_SECONDS);
              }}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:grid"
            >
              <RotateCw aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>

            <span className="shrink-0 text-[12px] font-medium tabular-nums text-white/95">
              {formatClock(currentTime)} / {formatClock(duration)}
            </span>

            <span className="min-w-0 flex-1" />

            <button
              type="button"
              aria-label="سرعت پخش"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                cycleRate();
              }}
              className="hidden h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black tabular-nums transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:flex"
            >
              {faDigits(String(rate))}×
            </button>

            <button
              type="button"
              aria-label={isMuted ? "فعال کردن صدای ویدیو" : "بی‌صدا کردن ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleMute();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 aria-hidden="true" className="h-[18px] w-[18px]" />
              )}
            </button>

            {canPictureInPicture ? (
              <button
                type="button"
                aria-label="پنجرهٔ شناور"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void togglePictureInPicture();
                }}
                className="hidden h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:grid"
              >
                <PictureInPicture2 aria-hidden="true" className="h-[18px] w-[18px]" />
              </button>
            ) : null}

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
