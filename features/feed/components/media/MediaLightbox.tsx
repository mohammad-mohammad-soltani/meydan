"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { FeedAttachment } from "../../types";
import { faDigits } from "./media-utils";

/**
 * Full-screen media viewer. Images and videos share one surface so prev/next
 * moves through every visual attachment; Escape closes, arrow keys and swipes
 * move between items (RTL: left arrow = next).
 */
export function MediaLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: FeedAttachment[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const current = items[index];
  const total = items.length;
  const dragStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && index < total - 1) onIndexChange(index + 1);
      if (event.key === "ArrowRight" && index > 0) onIndexChange(index - 1);
    };

    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, onClose, onIndexChange, total]);

  if (!current) return null;

  const finishDrag = (clientX: number) => {
    if (dragStart.current === null) return;
    const delta = clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) < 48) return;

    dragged.current = true;
    if (delta > 0 && index > 0) onIndexChange(index - 1);
    else if (delta < 0 && index < total - 1) onIndexChange(index + 1);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نمایشگر رسانه"
      dir="rtl"
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onClose();
      }}
      onPointerDown={(event) => {
        dragStart.current = event.clientX;
      }}
      onPointerUp={(event) => finishDrag(event.clientX)}
      onPointerCancel={() => {
        dragStart.current = null;
      }}
      className="fixed inset-0 z-[130] flex touch-pan-y select-none flex-col bg-scrim/95 backdrop-blur-md"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 p-3">
        <span className="rounded-pill bg-surface-glass/15 px-3 py-1.5 text-[11px] font-black tabular-nums text-on-solid">
          {faDigits(`${index + 1}`)} از {faDigits(`${total}`)}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="بستن نمایشگر"
          className="grid h-11 w-11 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6"
        onClick={(event) => event.stopPropagation()}
      >
        {current.icon === "video" && current.previewSrc ? (
          <video
            key={current.id}
            src={current.previewSrc}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-xl bg-black shadow-dialog"
          />
        ) : (
          // Remote/user-uploaded sources are rendered directly, like the feed cards.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={current.previewSrc}
            alt={current.previewAlt ?? current.label}
            draggable={false}
            className="max-h-full max-w-full rounded-xl object-contain shadow-dialog"
          />
        )}
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (index > 0) onIndexChange(index - 1);
            }}
            disabled={index === 0}
            aria-label="رسانهٔ قبلی"
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80 sm:right-4"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (index < total - 1) onIndexChange(index + 1);
            }}
            disabled={index === total - 1}
            aria-label="رسانهٔ بعدی"
            className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface-glass/15 text-on-solid outline-none transition-colors hover:bg-surface-glass/25 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-white/80 sm:left-4"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
