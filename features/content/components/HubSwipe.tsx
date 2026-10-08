"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { HubTab } from "./ContentHubTabs";

const ORDER: HubTab[] = ["top", "ava", "notes"];
const HREF: Record<HubTab, string> = { top: "/content", ava: "/content?tab=ava", notes: "/content?tab=notes" };
/** Distance and shape a horizontal drag needs before it counts as a tab swipe. */
const MIN_DX = 56;
const AXIS_RATIO = 1.6;
const SLIDE_PX = 28;
/** How far the finger has to move before the gesture locks to horizontal (and stops page scroll from also reading it). */
const LOCK_DX = 8;
/** Drag past an edge (no neighbouring tab that way) moves the content at this fraction of the finger's distance. */
const EDGE_RESISTANCE = 0.35;
const SNAP_BACK_MS = 220;
const EXIT_MS = 180;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A touch that begins inside something that scrolls sideways (or edits a value) belongs to that control. */
function ownsHorizontalTouch(target: EventTarget | null, stop: HTMLElement): boolean {
  for (let node = target as HTMLElement | null; node && node !== stop; node = node.parentElement) {
    if (node.matches?.("input,textarea,select,audio,video,[role=slider],[data-no-swipe]")) return true;
    const overflowX = getComputedStyle(node).overflowX;
    if ((overflowX === "auto" || overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1) return true;
  }
  return false;
}

type DragState = { x: number; y: number; time: number; blocked: boolean; locked: boolean };

/**
 * Wraps the body of a «بسته محتوا» tab: slides the new tab in from the side it
 * sits on, and lets a horizontal drag move to the neighbouring tab — the
 * content tracks the finger 1:1 while dragging (with resistance past an
 * edge), then either settles into the next tab or springs back, instead of
 * jumping straight from one tab to the other on release. Carousels and other
 * sideways scrollers keep their own touches.
 */
export function HubSwipe({ active, children }: { active: HubTab; children: ReactNode }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const previous = useRef<HubTab>(active);
  const start = useRef<DragState | null>(null);
  /** A settle/exit from a previous gesture, so a new touch can cancel it before it clobbers the new one's style. */
  const pendingSettle = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const from = ORDER.indexOf(previous.current);
    const to = ORDER.indexOf(active);
    previous.current = active;
    const node = rootRef.current;
    if (from === to || !node || reducedMotion()) return;
    // The strip reads right to left, so a later tab enters from the left.
    const offset = to > from ? -SLIDE_PX : SLIDE_PX;
    node.animate(
      [{ transform: `translate3d(${offset}px,0,0)`, opacity: 0 }, { transform: "translate3d(0,0,0)", opacity: 1 }],
      { duration: 280, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );
  }, [active]);

  useEffect(() => () => {
    if (pendingSettle.current !== undefined) window.clearTimeout(pendingSettle.current);
  }, []);

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const node = rootRef.current;
    if (pendingSettle.current !== undefined) {
      window.clearTimeout(pendingSettle.current);
      pendingSettle.current = undefined;
    }
    if (node) {
      node.style.transition = "none";
    }
    if (event.touches.length !== 1) {
      start.current = null;
      return;
    }
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY, time: event.timeStamp, blocked: ownsHorizontalTouch(event.target, event.currentTarget), locked: false };
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const origin = start.current;
    const node = rootRef.current;
    if (!origin || origin.blocked || !node || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;

    if (!origin.locked) {
      if (Math.abs(dx) < LOCK_DX || Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
      origin.locked = true;
    }

    // Dragging right pulls the tab on the left (the next one) into view.
    const hasTarget = ORDER[ORDER.indexOf(active) + (dx > 0 ? 1 : -1)] !== undefined;
    node.style.transform = `translate3d(${hasTarget ? dx : dx * EDGE_RESISTANCE}px,0,0)`;
  };

  /** Springs the drag back to the resting position without switching tabs. */
  const snapBack = (node: HTMLDivElement) => {
    if (reducedMotion()) {
      node.style.transition = "none";
      node.style.transform = "";
      return;
    }
    node.style.transition = `transform ${SNAP_BACK_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
    node.style.transform = "translate3d(0,0,0)";
    pendingSettle.current = window.setTimeout(() => {
      node.style.transition = "";
      node.style.transform = "";
      pendingSettle.current = undefined;
    }, SNAP_BACK_MS);
  };

  const onTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const origin = start.current;
    const node = rootRef.current;
    start.current = null;
    if (!origin || origin.blocked || !origin.locked || !node) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const elapsed = Math.max(1, event.timeStamp - origin.time);
    const fast = Math.abs(dx) / elapsed > 0.5;
    const committed = Math.abs(dx) >= (fast ? MIN_DX * 0.6 : MIN_DX);
    const next = committed ? ORDER[ORDER.indexOf(active) + (dx > 0 ? 1 : -1)] : undefined;

    if (!next) {
      snapBack(node);
      return;
    }

    if (reducedMotion()) {
      node.style.transition = "none";
      node.style.transform = "";
      router.replace(HREF[next] as Route, { scroll: false });
      return;
    }

    // Let the drag's own motion carry the content the rest of the way off screen,
    // then swap tabs: the effect above slides the new one in once `active` changes.
    const width = node.getBoundingClientRect().width || window.innerWidth;
    const exit = Math.sign(dx) * Math.max(width * 0.3, 120);
    node.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${EXIT_MS}ms linear`;
    node.style.transform = `translate3d(${exit}px,0,0)`;
    node.style.opacity = "0";
    pendingSettle.current = window.setTimeout(() => {
      node.style.transition = "none";
      node.style.transform = "";
      node.style.opacity = "";
      pendingSettle.current = undefined;
      router.replace(HREF[next] as Route, { scroll: false });
    }, EXIT_MS);
  };

  const onTouchCancel = () => {
    const origin = start.current;
    const node = rootRef.current;
    start.current = null;
    if (origin?.locked && node) snapBack(node);
  };

  return (
    <div ref={rootRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}>
      {children}
    </div>
  );
}
