"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";

/**
 * Finger-tracked pager for the timeline tabs.
 *
 * Panes are ordered right-to-left, so index 0 is the right-most pane and the
 * neighbour at index + 1 sits to its left: dragging the content to the right
 * pulls the next pane in, exactly like the RTL tab strip reads.
 *
 * Only the active pane lives in the document flow — it owns the page height and
 * the scroll position. The incoming pane is drawn in a viewport-sized fixed
 * layer for the length of the gesture, which keeps both the page height and the
 * scroll offset untouched when the drag is released without a commit.
 */

/** Ignore jitter before deciding the gesture belongs to us. */
const AXIS_LOCK_PX = 10;
/** Share of the pane width that has to be dragged for a lazy release to commit. */
const COMMIT_RATIO = 0.3;
/** px/ms past which a short flick commits anyway. */
const COMMIT_VELOCITY = 0.45;
/** Pull felt when dragging past the first/last pane. */
const OVERSCROLL_FACTOR = 0.18;
const SETTLE_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const SETTLE_MIN_MS = 180;
const SETTLE_MAX_MS = 420;

function scrollParent(node: HTMLElement | null): HTMLElement | null {
  for (let current = node?.parentElement ?? null; current; current = current.parentElement) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return current;
  }
  return null;
}

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  axis: "unknown" | "x" | "y";
  width: number;
};

type Incoming = {
  index: number;
  /** -1 when the incoming pane rests to the left of the active one, 1 to the right. */
  side: -1 | 1;
};

type FeedSwipePagerProps = {
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
  /** Pane shown while it slides in; it is replaced by the real pane on commit. */
  renderIncoming: (index: number) => ReactNode;
  /** Sticky element the incoming layer must stay below (the tab strip). */
  topBoundaryRef: RefObject<HTMLElement | null>;
  /** Live 0…count-1 position of the drag, for the tab underline. */
  onDragPosition?: (position: number | null) => void;
  children: ReactNode;
};

export function FeedSwipePager({
  index,
  count,
  onIndexChange,
  renderIncoming,
  topBoundaryRef,
  onDragPosition,
  children,
}: FeedSwipePagerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const [incoming, setIncoming] = useState<Incoming | null>(null);

  const reportPosition = useCallback((position: number | null) => {
    onDragPosition?.(position);
  }, [onDragPosition]);

  const paint = useCallback((offset: number, target: Incoming | null, width: number) => {
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${offset}px, 0, 0)`;
    const pane = incomingRef.current;
    if (pane && target) pane.style.transform = `translate3d(${offset + target.side * width}px, 0, 0)`;
  }, []);

  const clearTransition = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = "";
      trackRef.current.style.transform = "";
    }
    if (incomingRef.current) {
      incomingRef.current.style.transition = "";
      incomingRef.current.style.transform = "";
    }
  }, []);

  /**
   * The incoming pane is previewed from its own top, so the committed pane has
   * to start there too. Pulling the scroller up to the pane's top edge keeps
   * the sticky tab strip exactly where it is and avoids landing mid-list.
   */
  const alignToPaneTop = useCallback(() => {
    const root = rootRef.current;
    const scroller = scrollParent(root);
    if (!root || !scroller) return;
    const boundary = topBoundaryRef.current?.getBoundingClientRect();
    const delta = root.getBoundingClientRect().top - (boundary?.bottom ?? 0);
    if (delta < -0.5) scroller.scrollTop = Math.max(0, scroller.scrollTop + delta);
  }, [topBoundaryRef]);

  const finish = useCallback((offset: number, target: Incoming | null, commit: boolean, velocity: number, width: number) => {
    const destination = commit && target ? -target.side * width : 0;
    const distance = Math.abs(destination - offset);
    const speed = Math.max(Math.abs(velocity), 0.6);
    const duration = Math.min(SETTLE_MAX_MS, Math.max(SETTLE_MIN_MS, distance / speed));

    const settle = () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        if (commit && target) alignToPaneTop();
        clearTransition();
        setIncoming(null);
        reportPosition(null);
        if (commit && target) onIndexChange(target.index);
      }, duration + 20);
    };

    for (const node of [trackRef.current, incomingRef.current]) {
      if (!node) continue;
      node.style.transition = `transform ${duration}ms ${SETTLE_EASING}`;
    }
    // Commit to the transition start value before flipping to the destination.
    requestAnimationFrame(() => {
      paint(destination, target, width);
      settle();
    });
  }, [alignToPaneTop, clearTransition, onIndexChange, paint, reportPosition]);

  const placeLayer = useCallback(() => {
    const layer = layerRef.current;
    const root = rootRef.current;
    if (!layer || !root) return;
    const rect = root.getBoundingClientRect();
    const boundary = topBoundaryRef.current?.getBoundingClientRect();
    const top = Math.max(rect.top, boundary?.bottom ?? 0);
    layer.style.left = `${rect.left}px`;
    layer.style.width = `${rect.width}px`;
    layer.style.top = `${top}px`;
    layer.style.height = `${Math.max(0, window.innerHeight - top)}px`;
  }, [topBoundaryRef]);

  useEffect(() => {
    if (!incoming) return;
    placeLayer();
  }, [incoming, placeLayer]);

  useEffect(() => () => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;
    if (gestureRef.current || settleTimerRef.current) return;
    const width = rootRef.current?.getBoundingClientRect().width ?? 0;
    if (!width) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      axis: "unknown",
      width,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (gesture.axis === "unknown") {
      if (Math.abs(dy) > AXIS_LOCK_PX && Math.abs(dy) >= Math.abs(dx)) {
        // A vertical scroll owns the pointer from here on.
        gestureRef.current = null;
        return;
      }
      if (Math.abs(dx) <= AXIS_LOCK_PX || Math.abs(dx) <= Math.abs(dy)) return;
      gesture.axis = "x";
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is a nicety; the gesture still tracks without it.
      }
    }

    const elapsed = event.timeStamp - gesture.lastTime;
    if (elapsed > 0) {
      const instant = (event.clientX - gesture.lastX) / elapsed;
      gesture.velocity = gesture.velocity * 0.7 + instant * 0.3;
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
    }

    // Dragging right reveals the pane to the left, which is the next index.
    const wanted = dx > 0 ? index + 1 : index - 1;
    const withinBounds = wanted >= 0 && wanted < count;
    const side: -1 | 1 = dx > 0 ? -1 : 1;
    const offset = withinBounds
      ? Math.max(-gesture.width, Math.min(gesture.width, dx))
      : dx * OVERSCROLL_FACTOR;

    if (withinBounds && (!incoming || incoming.index !== wanted)) {
      setIncoming({ index: wanted, side });
    } else if (!withinBounds && incoming) {
      setIncoming(null);
    }

    paint(offset, withinBounds ? { index: wanted, side } : null, gesture.width);
    reportPosition(withinBounds ? index + (wanted - index) * (Math.abs(offset) / gesture.width) : index);
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (gesture.axis !== "x") {
      gestureRef.current = null;
      return;
    }

    const dx = event.clientX - gesture.startX;
    const wanted = dx > 0 ? index + 1 : index - 1;
    const withinBounds = wanted >= 0 && wanted < count;
    const side: -1 | 1 = dx > 0 ? -1 : 1;
    const offset = withinBounds
      ? Math.max(-gesture.width, Math.min(gesture.width, dx))
      : dx * OVERSCROLL_FACTOR;
    const flicked = Math.abs(gesture.velocity) > COMMIT_VELOCITY && Math.sign(gesture.velocity) === Math.sign(dx);
    const commit = !cancelled && withinBounds && (Math.abs(offset) > gesture.width * COMMIT_RATIO || flicked);

    finish(offset, withinBounds ? { index: wanted, side } : null, commit, gesture.velocity, gesture.width);
    gestureRef.current = null;
  };

  return (
    <div ref={rootRef} className="relative w-full" style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endGesture(event, false)}
      onPointerCancel={(event) => endGesture(event, true)}
    >
      <div ref={trackRef} className="w-full will-change-transform">
        {children}
      </div>
      {incoming ? (
        <div
          ref={layerRef}
          aria-hidden="true"
          className="pointer-events-none fixed z-20 overflow-hidden"
          style={{ contain: "paint" }}
        >
          {/* Only the sliding pane is opaque — the layer itself must stay
              transparent so the outgoing timeline is visible sliding away. */}
          <div ref={incomingRef} className="h-full w-full overflow-hidden bg-background will-change-transform">
            {renderIncoming(incoming.index)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
