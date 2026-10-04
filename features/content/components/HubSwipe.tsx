"use client";

import { useLayoutEffect, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { HubTab } from "./ContentHubTabs";

const ORDER: HubTab[] = ["top", "ava", "notes"];
const HREF: Record<HubTab, string> = { top: "/content", ava: "/content?tab=ava", notes: "/content?tab=notes" };
/** Distance and shape a horizontal drag needs before it counts as a tab swipe. */
const MIN_DX = 56;
const AXIS_RATIO = 1.6;
const SLIDE_PX = 28;

/** A touch that begins inside something that scrolls sideways (or edits a value) belongs to that control. */
function ownsHorizontalTouch(target: EventTarget | null, stop: HTMLElement): boolean {
  for (let node = target as HTMLElement | null; node && node !== stop; node = node.parentElement) {
    if (node.matches?.("input,textarea,select,audio,video,[role=slider],[data-no-swipe]")) return true;
    const overflowX = getComputedStyle(node).overflowX;
    if ((overflowX === "auto" || overflowX === "scroll") && node.scrollWidth > node.clientWidth + 1) return true;
  }
  return false;
}

/**
 * Wraps the body of a «بسته محتوا» tab: slides the new tab in from the side it
 * sits on, and lets a horizontal swipe move to the neighbouring tab. Carousels
 * and other sideways scrollers keep their own touches.
 */
export function HubSwipe({ active, children }: { active: HubTab; children: ReactNode }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const previous = useRef<HubTab>(active);
  const start = useRef<{ x: number; y: number; time: number; blocked: boolean } | null>(null);

  useLayoutEffect(() => {
    const from = ORDER.indexOf(previous.current);
    const to = ORDER.indexOf(active);
    previous.current = active;
    const node = rootRef.current;
    if (from === to || !node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The strip reads right to left, so a later tab enters from the left.
    const offset = to > from ? -SLIDE_PX : SLIDE_PX;
    node.animate(
      [{ transform: `translate3d(${offset}px,0,0)`, opacity: 0 }, { transform: "translate3d(0,0,0)", opacity: 1 }],
      { duration: 280, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );
  }, [active]);

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      start.current = null;
      return;
    }
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY, time: event.timeStamp, blocked: ownsHorizontalTouch(event.target, event.currentTarget) };
  };

  const onTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin || origin.blocked) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const fast = Math.abs(dx) / Math.max(1, event.timeStamp - origin.time) > 0.5;
    if (Math.abs(dx) < (fast ? MIN_DX * 0.6 : MIN_DX) || Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;
    // Dragging right pulls the tab on the left (the next one) into view.
    const next = ORDER[ORDER.indexOf(active) + (dx > 0 ? 1 : -1)];
    if (next) router.replace(HREF[next] as Route, { scroll: false });
  };

  return (
    <div ref={rootRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { start.current = null; }}>
      {children}
    </div>
  );
}
