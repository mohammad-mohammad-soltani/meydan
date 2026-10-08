"use client";

import { ArrowDown, LoaderCircle } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Distance the finger has to travel (after resistance) before a release refreshes. */
const TRIGGER_PX = 64;
/** Where the content rests while the refresh runs. */
const HOLD_PX = 52;
const MAX_PULL_PX = 120;
/** Share of the finger's travel that the content follows, so the pull feels elastic. */
const RESISTANCE = 0.5;
const AXIS_LOCK_PX = 8;
/** Keeps the spinner from flashing when the refresh answers instantly. */
const MIN_SPIN_MS = 500;
const SETTLE = "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)";

function scrollParent(node: HTMLElement | null): HTMLElement | null {
  for (let current = node?.parentElement ?? null; current; current = current.parentElement) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return current;
  }
  return null;
}

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  /** Stays put while the list below is pulled (the filter chips), but still starts the gesture. */
  header?: ReactNode;
  children: ReactNode;
};

/**
 * Touch pull-to-refresh for the page scroller: at the very top, dragging down
 * stretches the content like X does, and releasing past the threshold reloads.
 *
 * Like the tab pager, the gesture writes styles straight to the DOM so the
 * feed list is not re-rendered on every frame of the drag.
 */
export function PullToRefresh({ onRefresh, header, children }: PullToRefreshProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const spinnerRef = useRef<HTMLSpanElement>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollParent(root);
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    const arrow = arrowRef.current;
    const spinner = spinnerRef.current;
    if (!root || !scroller || !content || !indicator || !arrow || !spinner) return;

    // Stops the browser's own overscroll / pull-to-reload from competing.
    const previousOverscroll = scroller.style.overscrollBehaviorY;
    scroller.style.overscrollBehaviorY = "contain";

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;
    let refreshing = false;
    let pull = 0;

    const paint = (distance: number, animate: boolean) => {
      const transition = animate ? SETTLE : "none";
      content.style.transition = transition;
      indicator.style.transition = transition;
      content.style.transform = distance ? `translate3d(0, ${distance}px, 0)` : "";
      indicator.style.transform = `translate3d(0, ${distance - HOLD_PX}px, 0)`;
      indicator.style.opacity = String(Math.min(1, distance / (TRIGGER_PX * 0.6)));
      arrow.style.transform = `rotate(${distance >= TRIGGER_PX ? 180 : 0}deg)`;
    };

    const showSpinner = (spinning: boolean) => {
      spinner.style.display = spinning ? "grid" : "none";
      arrow.style.display = spinning ? "none" : "grid";
    };

    const rest = () => {
      paint(0, true);
      window.setTimeout(() => {
        // Fixed-position pane layers inside the pager must not be trapped by a
        // lingering transform, so the styles are fully cleared at rest.
        if (pulling || refreshing) return;
        content.style.transition = "";
        indicator.style.transition = "";
        indicator.style.opacity = "0";
      }, 240);
    };

    const onStart = (event: TouchEvent) => {
      if (refreshing || event.touches.length !== 1 || scroller.scrollTop > 0) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
      pulling = false;
      pull = 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (!pulling) {
        if (Math.abs(dx) > AXIS_LOCK_PX && Math.abs(dx) > Math.abs(dy)) {
          tracking = false;
          return;
        }
        if (dy < -AXIS_LOCK_PX || scroller.scrollTop > 0) {
          tracking = false;
          return;
        }
        if (dy <= AXIS_LOCK_PX) return;
        pulling = true;
        showSpinner(false);
      }

      if (event.cancelable) event.preventDefault();
      pull = Math.min(MAX_PULL_PX, Math.max(0, (dy - AXIS_LOCK_PX) * RESISTANCE));
      paint(pull, false);
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!pulling) return;
      pulling = false;

      if (pull < TRIGGER_PX) {
        rest();
        return;
      }

      refreshing = true;
      showSpinner(true);
      paint(HOLD_PX, true);
      const startedAt = Date.now();
      void Promise.resolve(onRefreshRef.current())
        .catch(() => undefined)
        .then(() => new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt)))))
        .finally(() => {
          refreshing = false;
          rest();
        });
    };

    root.addEventListener("touchstart", onStart, { passive: true });
    // Non-passive: the drag has to be able to cancel the browser's own scroll.
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.style.overscrollBehaviorY = previousOverscroll;
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={rootRef}>
      {header}
      {/* Clipped so the arrow rises out from under the header instead of over it. */}
      <div className="relative" style={{ overflow: "clip" }}>
        <div
          ref={indicatorRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center"
          style={{ height: HOLD_PX, opacity: 0, transform: `translate3d(0, ${-HOLD_PX}px, 0)` }}
        >
          <span className="mt-3 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-brand shadow-popover">
            <span ref={arrowRef} className="grid place-items-center transition-transform duration-150">
              <ArrowDown className="h-4 w-4" />
            </span>
            <span ref={spinnerRef} className="hidden place-items-center" style={{ display: "none" }}>
              <LoaderCircle className="h-4 w-4 animate-spin" />
            </span>
          </span>
        </div>
        <div ref={contentRef} className="relative z-10 bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
