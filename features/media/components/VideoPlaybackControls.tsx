import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from "react";
import {
  Maximize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { faDigits, formatClock } from "../media-utils";

const SKIP_SECONDS = 10;

type VideoPlaybackControlsProps = {
  isImmersive: boolean;
  showChrome: boolean;
  hideIdleMobileChrome: boolean;
  isPlaying: boolean;
  isSeeking: boolean;
  controlsVisible: boolean;
  hasControlsHost: boolean;
  progressRef: RefObject<HTMLDivElement | null>;
  seekingRef: RefObject<boolean>;
  setIsSeeking: Dispatch<SetStateAction<boolean>>;
  currentTime: number;
  duration: number;
  bufferedProgress: number;
  progress: number;
  seekFromClientX: (clientX: number) => void;
  finishSeeking: (event: ReactPointerEvent<HTMLDivElement>) => void;
  skip: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  togglePlayback: () => Promise<void>;
  cycleRate: () => void;
  rate: number;
  isMuted: boolean;
  toggleMute: () => void;
  canPictureInPicture: boolean;
  active?: boolean;
  togglePictureInPicture: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
};

export function VideoPlaybackControls({
  isImmersive,
  showChrome,
  hideIdleMobileChrome,
  isPlaying,
  isSeeking,
  controlsVisible,
  hasControlsHost,
  progressRef,
  seekingRef,
  setIsSeeking,
  currentTime,
  duration,
  bufferedProgress,
  progress,
  seekFromClientX,
  finishSeeking,
  skip,
  seekTo,
  togglePlayback,
  cycleRate,
  rate,
  isMuted,
  toggleMute,
  canPictureInPicture,
  active,
  togglePictureInPicture,
  toggleFullscreen,
}: VideoPlaybackControlsProps) {
  return (
    <div
      inert={isImmersive && !showChrome}
      data-playback-controls
      dir="ltr"
      className={`${hasControlsHost ? "viewer-playback-controls relative" : "absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-8"} transition-opacity duration-200 motion-reduce:transition-none ${
        isImmersive
          ? showChrome
            ? "opacity-100"
            : "pointer-events-none opacity-0"
          : hideIdleMobileChrome
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
          className={`pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full ${isImmersive ? "bg-white" : "bg-red-500"}`}
          style={{ width: `${progress}%` }}
        />
        <span
          className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-opacity ${
            isSeeking
              ? "opacity-100"
              : "opacity-0 group-hover/video:opacity-100 group-focus-within/video:opacity-100"
          }`}
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="flex min-h-9 items-center gap-1 text-white flex-row-reverse">
        <button
          type="button"
          data-control="play"
          aria-label={isPlaying ? "توقف موقت ویدیو" : "پخش ویدیو"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void togglePlayback();
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          {isPlaying ? (
            <Pause
              aria-hidden="true"
              className="h-[18px] w-[18px] fill-current"
            />
          ) : (
            <Play
              aria-hidden="true"
              className="ml-0.5 h-[18px] w-[18px] fill-current"
            />
          )}
        </button>

        <button
          type="button"
          data-skip-button
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
          data-skip-button
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

        <span
          data-control="time"
          className="shrink-0 text-[11px] font-medium tabular-nums text-white/95"
        >
          {formatClock(currentTime)} / {formatClock(duration)}
        </span>

        <span data-control="spacer" className="min-w-0 flex-1" />

        <button
          type="button"
          data-control="rate"
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
          data-control="volume"
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

        {canPictureInPicture && (active === undefined || isImmersive) ? (
          <button
            type="button"
            data-control="pip"
            aria-label="پنجرهٔ شناور"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void togglePictureInPicture();
            }}
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 @[360px]:grid"
          >
            <PictureInPicture2
              aria-hidden="true"
              className="h-[18px] w-[18px]"
            />
          </button>
        ) : null}

        <button
          type="button"
          data-control="fullscreen"
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
  );
}
