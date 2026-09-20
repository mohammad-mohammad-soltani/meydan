/* eslint-disable @next/next/no-img-element -- gallery sources are runtime upload URLs that the image optimizer cannot fetch. */
"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageOff,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import type { MediaItem } from "../types";
import { clamp, faDigits, mediaThumbnailSrc } from "../media-utils";
import { setVideoFeedOwner, stopVideoAutoplay } from "@/lib/video-sound";
import { VideoPlayer } from "./VideoPlayer";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const SWIPE_THRESHOLD = 48;
const DISMISS_THRESHOLD = 90;

type MediaLightboxProps = {
  items: MediaItem[];
  onOpenVideoFeed?: (item: MediaItem, video: HTMLVideoElement) => void;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Accessible name for the dialog, e.g. "رسانه‌های پیام". */
  label?: string;
};

/**
 * The one full-screen media viewer for the whole app.
 *
 * Images support pinch/wheel/button zoom, double-tap zoom and pan while zoomed;
 * videos use the shared immersive player. Prev/next moves through every visual
 * attachment — buttons, keyboard (RTL: ← next, → previous) and swipe — while
 * Escape, the close button and a backdrop tap close it.
 */
export function MediaLightbox({
  items,
  onOpenVideoFeed,
  index,
  onIndexChange,
  onClose,
  label = "نمایشگر رسانه",
}: MediaLightboxProps) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [playbackTimes] = useState(() => new Map<string, number>());
  const current = items[index];
  const total = items.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    stopVideoAutoplay();
    setVideoFeedOwner(true);
    document.querySelectorAll("video").forEach((video) => { if (!dialogRef.current?.contains(video)) video.pause(); });
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      stopVideoAutoplay();
      setVideoFeedOwner(false);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "Tab" && target?.closest("input, textarea, select")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      // Keep Tab inside the viewer while it is open.
      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = [
          ...dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.offsetParent !== null && !element.closest("[inert]"));
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || active === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      // A focused video player owns the arrow keys for its own seeking.
      if (target?.closest("[data-media-controls]")) return;

      if (event.key === "ArrowLeft" && index < total - 1) {
        event.preventDefault();
        setChromeVisible(true);
        onIndexChange(index + 1);
      } else if (event.key === "ArrowRight" && index > 0) {
        event.preventDefault();
        setChromeVisible(true);
        onIndexChange(index - 1);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, onClose, onIndexChange, total]);

  if (!current) return null;

  const goTo = (next: number) => {
    if (next < 0 || next > total - 1 || next === index) return;
    setChromeVisible(true);
    onIndexChange(next);
  };

  const downloadHref = current.downloadHref || (current.kind === "image" ? current.src : undefined);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      dir="rtl"
      className="fixed inset-0 z-[130] flex select-none flex-col bg-black"
    >
      <header inert={!chromeVisible} className={`viewer-chrome relative flex shrink-0 items-center justify-between gap-3 p-3 ${chromeVisible ? "" : "viewer-chrome-hidden"}`}>
        <span
          aria-live="polite"
          className="rounded-pill bg-surface-glass/15 px-3 py-1.5 text-[11px] font-black tabular-nums text-on-solid"
        >
          {faDigits(String(index + 1))} از {faDigits(String(total))}
        </span>

        {total > 1 ? (
          <div
            role="group"
            aria-label="انتخاب رسانه"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 sm:flex"
          >
            {items.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(itemIndex)}
                aria-label={`رسانهٔ ${faDigits(String(itemIndex + 1))}`}
                aria-current={itemIndex === index ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all duration-200 motion-reduce:transition-none ${
                  itemIndex === index ? "w-5 bg-surface-glass/90" : "w-1.5 bg-surface-glass/40 hover:bg-surface-glass/70"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {downloadHref ? (
            <a
              href={downloadHref}
              download={current.title}
              target="_blank"
              rel="noreferrer"
              aria-label="دانلود رسانه"
              className="grid h-11 w-11 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Download aria-hidden="true" className="h-5 w-5" />
            </a>
          ) : null}

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="بستن نمایشگر"
            className="grid h-11 w-11 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-20 sm:pb-6">
        {/* Keyed by item so zoom/pan reset naturally when the item changes. */}
        <MediaStage
          key={current.id}
          item={current}
          onOpenVideoFeed={onOpenVideoFeed}
          onSwipe={(direction) => goTo(index + direction)}
          onBackdropClick={onClose}
          chromeVisible={chromeVisible}
          onToggleChrome={() => setChromeVisible((value) => !value)}
          initialTime={playbackTimes.get(current.id) || 0}
          onPlaybackTime={(time) => playbackTimes.set(current.id, time)}
        />
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="رسانهٔ قبلی"
            inert={!chromeVisible}
            style={{ opacity: chromeVisible ? 1 : 0, pointerEvents: chromeVisible ? undefined : "none" }}
            className="viewer-chrome absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80 sm:right-4"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            aria-label="رسانهٔ بعدی"
            inert={!chromeVisible}
            style={{ opacity: chromeVisible ? 1 : 0, pointerEvents: chromeVisible ? undefined : "none" }}
            className="viewer-chrome absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80 sm:left-4"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

/**
 * The stage owns zoom/pan because it is remounted per item (`key`), which keeps
 * every item starting at 1× without a reset effect.
 */
export function MediaStage({
  item,
  onOpenVideoFeed,
  onSwipe,
  onBackdropClick,
  immersive = false, chromeVisible = true, onToggleChrome, initialTime = 0, onPlaybackTime,
}: {
  item: MediaItem;
  onOpenVideoFeed?: (item: MediaItem, video: HTMLVideoElement) => void;
  onSwipe: (direction: number) => void;
  onBackdropClick: () => void;
  immersive?: boolean;
  chromeVisible?: boolean;
  onToggleChrome?: () => void;
  initialTime?: number;
  onPlaybackTime?: (time: number) => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  const [imageRatio, setImageRatio] = useState<number | null>(
    item.kind === "image" && item.width && item.height
      ? item.width / item.height
      : null,
  );
  const [previewBroken, setPreviewBroken] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /**
   * The thumbnail the card already fetched. Painting it under the original is
   * what makes opening a photo feel instant instead of showing an empty stage
   * while a multi-megabyte upload downloads.
   */
  const previewSrc = item.kind === "image" ? mediaThumbnailSrc(item.src) : undefined;
  const showPreview = Boolean(previewSrc) && !previewBroken && imageState !== "ready";
  // In the immersive post viewer an image fills the viewer width by default.
  // Only an image so tall that full width would exceed the viewport is narrowed.
  const immersiveImageWidth =
    immersive && imageRatio
      ? `min(100%, ${Math.max(0.01, imageRatio) * 100}dvh)`
      : immersive
        ? "100%"
        : undefined;

  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const pan = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const moved = useRef(false);

  const applyView = useCallback((nextZoom: number, nextOffset: { x: number; y: number }) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const stage = stageRef.current;
    const bounds = stage
      ? {
          x: Math.max(0, (stage.clientWidth * (clampedZoom - 1)) / 2),
          y: Math.max(0, (stage.clientHeight * (clampedZoom - 1)) / 2),
        }
      : { x: 0, y: 0 };
    const clampedOffset = {
      x: clamp(nextOffset.x, -bounds.x, bounds.x),
      y: clamp(nextOffset.y, -bounds.y, bounds.y),
    };

    zoomRef.current = clampedZoom;
    offsetRef.current = clampedOffset;
    setZoom(clampedZoom);
    setOffset(clampedOffset);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => applyView(zoomRef.current * factor, offsetRef.current),
    [applyView],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || item.kind !== "image") return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyView(zoomRef.current * (event.deltaY < 0 ? 1.15 : 0.87), offsetRef.current);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [applyView, item.kind]);

  // Zoom shortcuts, matching every desktop viewer.
  useEffect(() => {
    if (item.kind !== "image") return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-media-controls]")) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(1.4);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(1 / 1.4);
      } else if (event.key === "0") {
        event.preventDefault();
        applyView(MIN_ZOOM, { x: 0, y: 0 });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [applyView, item.kind, zoomBy]);

  const pointerDistance = () => {
    const [first, second] = [...pointers.current.values()];
    if (!first || !second) return 0;
    return Math.hypot(first.x - second.x, first.y - second.y);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, input, [role=slider]")) return;

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (item.kind === "image") event.currentTarget.setPointerCapture(event.pointerId);
    setIsGesturing(true);
    moved.current = false;

    if (pointers.current.size === 2) {
      pinch.current = { distance: pointerDistance(), zoom: zoomRef.current };
      pan.current = null;
      swipe.current = null;
      return;
    }

    if (zoomRef.current > MIN_ZOOM) {
      pan.current = {
        x: event.clientX,
        y: event.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
      swipe.current = null;
      return;
    }

    swipe.current = { x: event.clientX, y: event.clientY, moved: false };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch.current && pointers.current.size >= 2) {
      const distance = pointerDistance();
      if (pinch.current.distance > 0 && distance > 0) {
        applyView(pinch.current.zoom * (distance / pinch.current.distance), offsetRef.current);
      }
      return;
    }

    if (pan.current) {
      const dx = event.clientX - pan.current.x;
      const dy = event.clientY - pan.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
      applyView(zoomRef.current, {
        x: pan.current.offsetX + dx,
        y: pan.current.offsetY + dy,
      });
      return;
    }

    if (swipe.current) {
      const dx = event.clientX - swipe.current.x;
      const dy = event.clientY - swipe.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipe.current.moved = true;
        moved.current = true;
      }
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      pan.current = null;
      setIsGesturing(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const gesture = swipe.current;
    swipe.current = null;
    if (!gesture) return;

    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;

    // A downward pull dismisses, the way every touch viewer behaves.
    if (!immersive && dy > DISMISS_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.5) {
      onBackdropClick();
      return;
    }

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
    // RTL: dragging toward the right reveals the previous item.
    onSwipe(dx > 0 ? -1 : 1);
  };

  if (item.kind === "video") {
    return (
      <div className="flex h-full w-full touch-none items-center justify-center [container-type:size]"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endPointer}
        onPointerCancel={() => { swipe.current = null; pointers.current.clear(); }}
        onClickCapture={(event) => { if (moved.current) { event.preventDefault(); event.stopPropagation(); moved.current = false; } }}
      >
        <VideoPlayer item={item} variant="immersive" active initialTime={initialTime} onPlaybackTime={onPlaybackTime} chromeVisible={chromeVisible} onToggleChrome={onToggleChrome} autoPlay onRequestFullscreen={onOpenVideoFeed ? (video) => onOpenVideoFeed(item, video) : undefined} />
      </div>
    );
  }

  if (item.kind !== "image" || !item.src) return null;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        ref={stageRef}
        data-image-stage
        data-image-gesturing={zoom > MIN_ZOOM || isGesturing}
        className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={() => { swipe.current = null; pointers.current.clear(); pinch.current = null; pan.current = null; setIsGesturing(false); }}
        onClick={(event) => {
          // A tap on the empty backdrop closes; gestures never do.
          if (!moved.current && (immersive || event.target === event.currentTarget)) onBackdropClick();
        }}
        onDoubleClick={(event) => {
          if (zoomRef.current > MIN_ZOOM) {
            applyView(MIN_ZOOM, { x: 0, y: 0 });
            return;
          }

          // Zoom into the point that was tapped, not the middle of the frame.
          const stage = stageRef.current;
          if (!stage) return;
          const rect = stage.getBoundingClientRect();
          const point = {
            x: event.clientX - (rect.left + rect.width / 2),
            y: event.clientY - (rect.top + rect.height / 2),
          };
          applyView(DOUBLE_TAP_ZOOM, {
            x: point.x * (1 - DOUBLE_TAP_ZOOM),
            y: point.y * (1 - DOUBLE_TAP_ZOOM),
          });
        }}
      >
        {showPreview ? (
          // Same sizing rules as the original, so the swap does not jump much.
          <img
            src={previewSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={() => setPreviewBroken(true)}
            className="pointer-events-none absolute inset-0 m-auto max-w-full object-contain"
            style={immersive ? { width: immersiveImageWidth, height: "auto" } : undefined}
          />
        ) : null}

        <img
          key={attempt}
          src={item.src}
          alt={item.title}
          draggable={false}
          onLoad={(event) => {
            setImageState("ready");
            const width = event.currentTarget.naturalWidth;
            const height = event.currentTarget.naturalHeight;
            if (width > 0 && height > 0) setImageRatio(width / height);
          }}
          onError={() => setImageState("error")}
          className={`${immersive ? "" : "max-h-full min-w-[25vw]"} max-w-full object-contain ${
            isGesturing ? "" : "transition-transform duration-200 ease-out motion-reduce:transition-none"
          } ${zoom > MIN_ZOOM ? "cursor-grab" : "cursor-zoom-in"} ${
            imageState === "ready" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: immersiveImageWidth,
            height: immersive ? "auto" : undefined,
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          }}
        />

        {imageState === "loading" && !showPreview ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-glass/15 text-on-solid backdrop-blur-sm">
              <LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin motion-reduce:animate-none" />
            </span>
          </span>
        ) : null}

        {imageState === "error" ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-on-solid">
            <div>
              <ImageOff aria-hidden="true" className="mx-auto h-7 w-7" />
              <p className="mt-2 text-sm font-bold">نمایش تصویر ممکن نشد</p>
              <p className="mt-1 text-xs text-on-solid/70">فایل تصویر در دسترس نیست یا مرورگر نتوانست آن را باز کند.</p>
              <button
                type="button"
                onClick={() => {
                  setImageState("loading");
                  setAttempt((value) => value + 1);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-pill bg-surface-glass/15 px-4 py-2 text-xs font-black text-on-solid outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                تلاش دوباره
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div
        data-media-controls
        hidden={immersive && !chromeVisible}
        className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-pill bg-surface-glass/15 px-1.5 py-1 text-on-solid backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.4)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="کوچک‌نمایی"
          className="grid h-9 w-9 place-items-center rounded-full outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyView(MIN_ZOOM, { x: 0, y: 0 })}
          aria-label="بازنشانی بزرگ‌نمایی"
          className="min-w-14 rounded-full px-2 py-1 text-[11px] font-black tabular-nums outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
        >
          {faDigits(String(Math.round(zoom * 100)))}٪
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.4)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="بزرگ‌نمایی"
          className="grid h-9 w-9 place-items-center rounded-full outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
        {zoom > MIN_ZOOM ? (
          <button
            type="button"
            onClick={() => applyView(MIN_ZOOM, { x: 0, y: 0 })}
            aria-label="بازنشانی نمایش"
            className="grid h-9 w-9 place-items-center rounded-full outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
