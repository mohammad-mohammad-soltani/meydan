"use client";

import { useRef, type PointerEvent, type MouseEvent } from "react";

/** Desktop dragging of a real horizontal list; taps still reach links and buttons. */
export function useHorizontalDrag() {
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
      drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
      suppressClick.current = false;
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      const delta = event.clientX - start.x;
      if (!start.moved && Math.abs(delta) < 8) return;
      start.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
      event.currentTarget.scrollLeft = start.scroll - delta;
      event.preventDefault();
    },
    onPointerUp(event: PointerEvent<HTMLDivElement>) {
      suppressClick.current = Boolean(drag.current?.moved);
      drag.current = null;
      delete event.currentTarget.dataset.dragging;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel(event: PointerEvent<HTMLDivElement>) {
      drag.current = null;
      delete event.currentTarget.dataset.dragging;
    },
    onDragStart(event: React.DragEvent<HTMLDivElement>) { event.preventDefault(); },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (!suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    },
  };
}
