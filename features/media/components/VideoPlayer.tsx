"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
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
import { VideoPreview } from "./VideoPreview";
import type { MediaItem } from "../types";
import {
  clamp,
  faDigits,
  formatClock,
  videoAspectRatio,
  resolveBufferedEnd,
  resolveMediaDuration,
} from "../media-utils";
import {
  beginVideoAutoplay,
  continueVideoAutoplay,
  handoffHolders,
  isVideoAutoplayActive,
  listPlayers,
  readStoredVideoMuted,
  registerPlayer,
  setVideoMuted,
  stopVideoAutoplay,
  subscribeToVideoMuted,
  videoMutedServerSnapshot,
  videoMutedSnapshot,
} from "@/lib/video-sound";

const SKIP_SECONDS = 10;
const RATES = [1, 1.25, 1.5, 2];

/**
 * How much of the video must remain on screen for playback to continue.
 * A player that is scrolled further out than this pauses itself, so a
 * timeline never keeps playing audio from a card the reader has left behind.
 */
const VISIBLE_PLAYBACK_THRESHOLD = 0.5;

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
  /**
   * How eagerly the browser may fetch the file.
   *
   * Cards in a timeline pass `"none"` so a feed requests nothing until the
   * reader taps play — these uploads are not web-optimized, so even metadata
   * costs extra range requests per card. The lightbox and dedicated pages keep
   * the default, because there the reader already asked for the video.
   */
  preload?: "none" | "metadata" | "auto";
  className?: string;
  /**
   * For a single inline landscape video, keep the mobile idle state clean:
   * only the large centered play button is shown until playback starts.
   */
  hideIdleControlsOnMobile?: boolean;
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
  preload = "metadata",
  className = "",
  hideIdleControlsOnMobile = false,
}: VideoPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const seekingRef = useRef(false);

  const [hasFrame, setHasFrame] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Sound is a shared, persisted preference: muting one player mutes them all.
  const isMuted = useSyncExternalStore(
    subscribeToVideoMuted,
    videoMutedSnapshot,
    videoMutedServerSnapshot,
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState(1);
  /**
   * True when this player is the one currently holding the handoff: the
   * session is on, and this card's play was issued by the handoff rather than
   * by a tap. Only such a player may hand play on to whoever enters next.
   */
  const [hasHandoff, setHasHandoff] = useState(false);
  // Mirrored into a ref so the observer callback never reads stale state. The
  // write happens in an effect, not during render, because refs are not part of
  // rendering and mutating one mid-render can desynchronise the two.
  const hasHandoffRef = useRef(false);
  useEffect(() => {
    hasHandoffRef.current = hasHandoff;
  }, [hasHandoff]);
  const canPictureInPicture = useSyncExternalStore(
    subscribeToNothing,
    pictureInPictureSupported,
    () => false,
  );
  const source = item.src;
  const [decodedRatio, setDecodedRatio] = useState<{ source: string; ratio: number } | null>(null);
  const aspectRatio = decodedRatio && decodedRatio.source === source
    ? decodedRatio.ratio
    : videoAspectRatio(item.width, item.height);
  const progress = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const bufferedProgress = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;
  const hideIdleMobileChrome =
    hideIdleControlsOnMobile && variant === "inline" && aspectRatio >= 1 && !isPlaying;

  const syncDuration = (video: HTMLVideoElement) => {
    const resolved = resolveMediaDuration(video);
    if (resolved > 0) setDuration(resolved);
    return resolved;
  };

  const syncVideoMetrics = (video: HTMLVideoElement) => {
    syncDuration(video);
    setBuffered(resolveBufferedEnd(video));

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setDecodedRatio({ source: source || "", ratio: videoAspectRatio(video.videoWidth, video.videoHeight) });
    }

    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setRate(video.playbackRate || 1);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timeout = setTimeout(() => setControlsVisible(false), 2600);
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  useEffect(() => () => {
    if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
  }, []);

  const revealControls = () => {
    setControlsVisible(true);
    if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
    hideControlsRef.current = setTimeout(() => setControlsVisible(false), 2600);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (video.paused || video.ended) {
      setHasHandoff(false);
      // A tap on play is the gesture that starts the handoff session.
      beginVideoAutoplay();
      try {
        await video.play();
      } catch {
        setHasError(true);
      }
      return;
    }

    // An explicit pause ends the session: nothing may restart on its own.
    setHasHandoff(false);
    stopVideoAutoplay();
    video.pause();
  };

  /**
   * Mute is app-wide, not per player: the menu on a timeline card sets the
   * preference for every video in the document, mounted or not.
   *
   * Muting also ends the handoff — the reader asked for quiet, so scrolling
   * must not start the next video talking.
   */
  const toggleMute = () => {
    stopVideoAutoplay();
    setVideoMuted(!readStoredVideoMuted());
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

  // Keep this element on the shared preference, including on first mount, and
  // apply it before the browser can start an autoplaying video with sound.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
  }, [isMuted]);

  /**
   * Pause when the player leaves the viewport — and, while a handoff session
   * is live, play when it arrives.
   *
   * Exiting: once less than half of the frame is on screen the video pauses.
   * The play button stays visible (state comes from the element), so the
   * reader can resume from the same position when they scroll back.
   *
   * Arriving: if the reader had started a handoff (they tapped play on a video
   * and then scrolled past it), whichever video enters the viewport next picks
   * playback up on its own, and passes it on again when it leaves. The chain
   * survives until the reader pauses or mutes a video by hand.
   *
   * Two arriving players are separated by where they sit on screen: a fast
   * fling can report a lower card as visible before the one under the reader's
   * eye, so the player nearest the middle of the viewport wins and the others
   * decline, even when they are told to play afterwards.
   */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof IntersectionObserver === "undefined") return;

    // Picture-in-picture and fullscreen deliberately take the video out of the
    // page flow, so leaving the viewport must not pause them there.
    const isDetachedFromPage = () => {
      const video = videoRef.current;
      if (!video) return true;
      return (
        document.pictureInPictureElement === video ||
        document.fullscreenElement === wrapper
      );
    };

    const distanceFromViewportMiddle = (rect: DOMRect) =>
      Math.abs(rect.top + rect.height / 2 - (window.innerHeight || 0) / 2);

    /** True when no on-screen rival sits closer to the middle of the screen. */
    const isNearestVisiblePlayer = () => {
      const rect = wrapper.getBoundingClientRect();
      const mine = distanceFromViewportMiddle(rect);

      return listPlayers().every(({ element, video }) => {
        if (element === wrapper || video.paused) return true;
        return mine <= distanceFromViewportMiddle(element.getBoundingClientRect());
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = videoRef.current;
          if (!video || isDetachedFromPage()) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_PLAYBACK_THRESHOLD) {
            // Claim the handoff only if the session is still live, this player
            // is not already playing, and it is the best-placed candidate.
            if (!isVideoAutoplayActive() || !video.paused || !isNearestVisiblePlayer()) {
              continue;
            }

            setHasHandoff(true);
            handoffHolders.set(video, setHasHandoff);

            void video.play().catch(() => {
              // Autoplay refused (no gesture yet, or a data-saver policy) or
              // another player won the tie-break and vetoed us.
              setHasHandoff(false);
            });
            continue;
          }

          // Leaving the viewport: pause, and pass the handoff on if we held it.
          if (video.paused) continue;

          const handedOff = hasHandoffRef.current;
          setHasHandoff(false);
          video.pause();
          if (handedOff) continueVideoAutoplay();
        }
      },
      { threshold: [0, VISIBLE_PLAYBACK_THRESHOLD] },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  /**
   * Only one player may play at a time. The registry doubles as a veto: a
   * rival that was already commanded to play stands down before the browser
   * starts it, so the two never talk over each other.
   */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const handlePlay = () => {
      if (!isVideoAutoplayActive()) return;

      for (const { element, video: other } of listPlayers()) {
        if (element === wrapper || other.paused) continue;

        // Never override a play the reader started by hand; only a handoff.
        const holder = handoffHolders.get(other);
        if (!holder) continue;

        other.pause();
        holder(false);
      }
    };

    return registerPlayer(wrapper, video, handlePlay);
  }, []);

  if (!source) return null;

  const isImmersive = variant === "immersive";

  return (
    <div
      ref={wrapperRef}
      data-media-controls
      data-video-player
      tabIndex={0}
      role="group"
      aria-label={item.title || "پخش‌کننده ویدیو"}
      className={`media-video-player group/video pointer-events-auto relative mx-auto overflow-hidden bg-black outline-none [container-type:inline-size] ${
        isImmersive
          ? "rounded-2xl border border-white/10 shadow-[0_24px_100px_#0008]"
          : `w-full rounded-2xl border border-border shadow-sm ${className}`
      }`}
      style={{
        aspectRatio,
        "--video-ratio": aspectRatio,
        width: isImmersive ? `min(100cqw, calc(100cqh * ${aspectRatio}))` : "100%",
        maxWidth: !isImmersive && aspectRatio < 1 ? `min(100%, ${aspectRatio * 72}dvh)` : undefined,
      } as CSSProperties}
      onPointerMove={revealControls}
      onFocus={revealControls}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if ((event.target as HTMLElement).closest("button, [role=slider]")) return;

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
      onPointerDown={(event) => {
        revealControls();
        if (!(event.target as HTMLElement).closest("button, input, [role=slider]")) wrapperRef.current?.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("button, input, select, [role=slider]")) return;
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
        preload={preload}
        aria-label={item.title || "ویدیو"}
        className="absolute inset-0 h-full w-full cursor-pointer bg-black object-contain"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void togglePlayback();
        }}
        onLoadedMetadata={(event) => syncVideoMetrics(event.currentTarget)}
        onLoadedData={(event) => { setHasFrame(true); syncVideoMetrics(event.currentTarget); }}
        onResize={(event) => syncVideoMetrics(event.currentTarget)}
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
          syncVideoMetrics(event.currentTarget);
        }}
        onRateChange={(event) => setRate(event.currentTarget.playbackRate || 1)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
          setIsWaiting(false);
        }}
      />

      {!hasFrame && !isPlaying && !item.poster && !hasError ? (
        <span className="pointer-events-none absolute inset-0">
          <VideoPreview key={source} item={item} onRatio={(ratio) => setDecodedRatio({ source: source || "", ratio })} />
        </span>
      ) : null}

      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-200 ${
          hideIdleMobileChrome ? "opacity-0 sm:opacity-100" : "opacity-100"
        }`}
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
          className="absolute inset-0 z-30 m-auto grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-white/15 text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
        >
          <Play aria-hidden="true" className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      ) : null}

      {!hasError ? (
        <div
          dir="ltr"
          className={`absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-8 transition-opacity duration-200 ${
            hideIdleMobileChrome
              ? "pointer-events-none opacity-0 sm:pointer-events-auto sm:opacity-100"
              : isPlaying && !isSeeking && !controlsVisible
                ? "pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
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
            aria-valuetext={`${formatClock(currentTime)} از ${formatClock(duration)}`}
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
            <span className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/35" />
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25"
              style={{ width: `${bufferedProgress}%` }}
            />
            <span
              className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-red-500"
              style={{ width: `${progress}%` }}
            />
            <span
              className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-opacity ${
                isSeeking ? "opacity-100" : "opacity-0 group-hover/video:opacity-100 group-focus-within/video:opacity-100"
              }`}
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex min-h-9 items-center gap-1 text-white">
            <button
              type="button"
              aria-label={isPlaying ? "توقف موقت ویدیو" : "پخش ویدیو"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void togglePlayback();
              }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
              className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 @[360px]:grid"
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
              className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 @[360px]:grid"
            >
              <RotateCw aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>

            <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/95">
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
              className="hidden h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black tabular-nums transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 @[420px]:flex"
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
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
                className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 @[360px]:grid"
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
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
            <button type="button" className="mt-4 rounded-full border border-white/25 px-5 py-2 text-sm hover:bg-white/10"
              onClick={() => { setHasError(false); setIsWaiting(true); videoRef.current?.load(); }}>
              تلاش دوباره
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
