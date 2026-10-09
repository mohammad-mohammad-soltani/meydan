"use client";

import { useEffect } from "react";

/**
 * Makes every horizontally scrolling strip in the app draggable with a mouse,
 * with momentum and a rubber-band stretch at both ends — the way the same rails
 * already feel under a finger. Touch input is left to the browser, so this only
 * reacts to `pointerType === "mouse"`.
 *
 * It is one delegated listener set for the whole document rather than a hook
 * per rail: rails come and go with every route, and the nearest horizontally
 * scrollable ancestor of the pressed element is looked up on `pointerdown`.
 */

/** Pointer travel before a press turns into a drag (and swallows the click). */
const DRAG_THRESHOLD_PX = 4;
/** Most the content can be pulled past an end, however far the pointer goes. */
const STRETCH_MAX_PX = 140;
const STRETCH_SOFTNESS_PX = 200;
/** Samples older than this don't describe the release velocity. */
const VELOCITY_WINDOW_MS = 100;
/** Per-millisecond velocity decay while coasting. */
const FRICTION = 0.0035;
/** Spring that pulls an overshoot back (critically damped: damping = 2·√stiffness). */
const SPRING_STIFFNESS = 0.0012;
const SPRING_DAMPING = 2 * Math.sqrt(SPRING_STIFFNESS);
const REST_VELOCITY = 0.005;

const NO_DRAG = "input, textarea, select, [contenteditable=''], [contenteditable='true'], [data-no-drag-scroll]";

function findRail(start: EventTarget | null): HTMLElement | null {
  for (let node = start instanceof Element ? start : null; node && node !== document.body; node = node.parentElement) {
    if (!(node instanceof HTMLElement) || node.scrollWidth <= node.clientWidth + 1) continue;
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === "auto" || overflowX === "scroll") return node;
  }
  return null;
}

/** Diminishing-returns mapping from how far past the end we are to how far it is drawn. */
const stretchOf = (over: number) => Math.sign(over) * STRETCH_MAX_PX * (1 - Math.exp(-Math.abs(over) / STRETCH_SOFTNESS_PX));

type Drag = {
  rail: HTMLElement;
  pointerId: number;
  startX: number;
  startScroll: number;
  lo: number;
  hi: number;
  moved: boolean;
  /** Last unclamped scroll position, i.e. the clamped one plus any stretch past an end. */
  raw: number;
  samples: Array<{ x: number; t: number }>;
  snapType: string;
};

export function DragScroll() {
  useEffect(() => {
    let drag: Drag | null = null;
    let coast: number | null = null;
    let coastRail: HTMLElement | null = null;
    let coastSnap = "";
    let swallowClick = false;

    const drawStretch = (rail: HTMLElement, over: number) => {
      const shift = over === 0 ? "" : `translate3d(${-stretchOf(over)}px, 0, 0)`;
      for (const child of Array.from(rail.children)) {
        if (child instanceof HTMLElement) child.style.transform = shift;
      }
    };

    const place = (rail: HTMLElement, raw: number, lo: number, hi: number) => {
      const clamped = Math.min(hi, Math.max(lo, raw));
      rail.scrollLeft = clamped;
      drawStretch(rail, raw - clamped);
    };

    const finish = (rail: HTMLElement, snapType: string) => {
      drawStretch(rail, 0);
      rail.style.scrollSnapType = snapType;
      rail.style.cursor = "";
      document.documentElement.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    const stopCoast = () => {
      if (coast !== null) window.cancelAnimationFrame(coast);
      coast = null;
      if (coastRail) finish(coastRail, coastSnap);
      coastRail = null;
    };

    const startCoast = (d: Drag, velocity: number) => {
      const { rail, lo, hi } = d;
      let raw = d.raw;
      let v = velocity;
      let last = performance.now();
      coastRail = rail;
      coastSnap = d.snapType;

      const step = (now: number) => {
        const dt = Math.min(32, now - last);
        last = now;
        const bound = raw < lo ? lo : raw > hi ? hi : null;
        if (bound === null) {
          v *= Math.exp(-FRICTION * dt);
          raw += v * dt;
        } else {
          v += (-SPRING_STIFFNESS * (raw - bound) - SPRING_DAMPING * v) * dt;
          raw += v * dt;
        }
        const settled = Math.abs(v) < REST_VELOCITY && (bound === null || Math.abs(raw - bound) < 0.5);
        if (settled) {
          place(rail, Math.min(hi, Math.max(lo, raw)), lo, hi);
          coast = null;
          coastRail = null;
          finish(rail, d.snapType);
          return;
        }
        place(rail, raw, lo, hi);
        coast = window.requestAnimationFrame(step);
      };
      coast = window.requestAnimationFrame(step);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(NO_DRAG)) return;
      stopCoast();
      const rail = findRail(target);
      if (!rail) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const rtl = getComputedStyle(rail).direction === "rtl";
      drag = {
        rail,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: rail.scrollLeft,
        lo: rtl ? -max : 0,
        hi: rtl ? 0 : max,
        moved: false,
        raw: rail.scrollLeft,
        samples: [{ x: event.clientX, t: event.timeStamp }],
        snapType: rail.style.scrollSnapType,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        // Snap points would fight every scrollLeft write; they're restored on release.
        drag.rail.style.scrollSnapType = "none";
        drag.rail.style.cursor = "grabbing";
        document.documentElement.style.setProperty("cursor", "grabbing");
        document.body.style.setProperty("user-select", "none");
        window.getSelection()?.removeAllRanges();
      }
      drag.samples.push({ x: event.clientX, t: event.timeStamp });
      while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > VELOCITY_WINDOW_MS) drag.samples.shift();
      // The content follows the pointer, so the scroll offset moves the opposite way.
      drag.raw = drag.startScroll - dx;
      place(drag.rail, drag.raw, drag.lo, drag.hi);
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const finished = drag;
      drag = null;
      if (!finished.moved) return;
      swallowClick = true;
      window.setTimeout(() => { swallowClick = false; }, 0);
      const first = finished.samples[0];
      const elapsed = event.timeStamp - first.t;
      const velocity = elapsed > 0 && event.type === "pointerup" ? -(event.clientX - first.x) / elapsed : 0;
      startCoast(finished, velocity);
    };

    const onClick = (event: MouseEvent) => {
      if (!swallowClick) return;
      event.preventDefault();
      event.stopPropagation();
    };

    // A pressed link or image would start the browser's own drag-and-drop and cancel the pointer stream.
    const onDragStart = (event: DragEvent) => {
      if (event.target instanceof Element && findRail(event.target)) event.preventDefault();
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || drag) return;
      const rail = findRail(event.target);
      if (rail && !rail.style.cursor) rail.style.cursor = "grab";
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerEnd);
    document.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("click", onClick, true);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("pointerover", onPointerOver);
    return () => {
      stopCoast();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerEnd);
      document.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("pointerover", onPointerOver);
    };
  }, []);

  return null;
}
