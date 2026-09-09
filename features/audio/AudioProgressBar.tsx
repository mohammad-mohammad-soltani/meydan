"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useAudio } from "./AudioProvider";

export function formatAudioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type AudioProgressBarProps = {
  showTimes?: boolean;
  className?: string;
  compact?: boolean;
};

export function AudioProgressBar({
  showTimes = true,
  className = "",
  compact = false,
}: AudioProgressBarProps) {
  const { currentTime, duration, buffered, seek } = useAudio();
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState<number | null>(null);

  const value = previewTime ?? currentTime;
  const progress = duration > 0 ? Math.min(1, Math.max(0, value / duration)) : 0;
  const bufferedProgress =
    duration > 0 ? Math.min(1, Math.max(0, buffered / duration)) : 0;

  const timeFromClientX = (clientX: number): number | null => {
    const slider = sliderRef.current;
    if (!slider || duration <= 0) return null;
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return null;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const nextTime = timeFromClientX(event.clientX);
    if (nextTime === null) return;
    setPreviewTime(nextTime);
    seek(nextTime);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    event.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    updateFromPointer(event);
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    updateFromPointer(event);
    draggingRef.current = false;
    setDragging(false);
    setPreviewTime(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelPointer = (event: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setDragging(false);
    setPreviewTime(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const step = event.shiftKey ? 15 : 5;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      seek(Math.min(duration, currentTime + step));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      seek(Math.max(0, currentTime - step));
    } else if (event.key === "Home") {
      event.preventDefault();
      seek(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seek(duration);
    }
  };

  return (
    <div className={className} dir="ltr">
      <div className={`flex items-center ${showTimes ? "gap-3" : "gap-0"}`}>
        {showTimes ? (
          <span className="w-11 shrink-0 text-left text-[11px] tabular-nums opacity-70">
            {formatAudioTime(value)}
          </span>
        ) : null}

        <div
          ref={sliderRef}
          role="slider"
          aria-label="موقعیت پخش صوت"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration || 0)}
          aria-valuenow={Math.round(Math.min(duration || 0, Math.max(0, value)))}
          aria-valuetext={
            duration > 0
              ? `${formatAudioTime(value)} از ${formatAudioTime(duration)}`
              : "زمان صوت در حال بارگذاری"
          }
          aria-disabled={duration <= 0}
          tabIndex={duration > 0 ? 0 : -1}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          onKeyDown={handleKeyDown}
          className={`group relative flex-1 touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            duration > 0 ? "cursor-pointer" : "cursor-wait"
          } ${compact ? "h-5" : "h-7"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-glass ${
              compact ? "h-1" : "h-1.5"
            } ${duration <= 0 ? "animate-pulse" : ""}`}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-brand opacity-25"
              style={{ width: `${bufferedProgress * 100}%` }}
            />
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-brand"
              style={{ width: `${progress * 100}%` }}
            />
          </span>

          {duration > 0 ? (
            <span
              aria-hidden="true"
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-solid-light shadow-popover transition-[width,height,opacity] ${
                dragging
                  ? "h-4 w-4 opacity-100"
                  : compact
                    ? "h-3 w-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                    : "h-3.5 w-3.5 opacity-100"
              }`}
              style={{ left: `${progress * 100}%` }}
            />
          ) : null}
        </div>

        {showTimes ? (
          <span className="w-11 shrink-0 text-right text-[11px] tabular-nums opacity-70">
            {duration > 0 ? formatAudioTime(duration) : "--:--"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
