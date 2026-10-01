"use client";

import { useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Finger-tracked paging for a track of full-size panes.
 *
 * The track carries the whole offset — pane N sits at N × 100% and the track
 * sits at -index × 100% — so a drag is one style write per frame and changing
 * the index never moves a pane. Nothing about the gesture goes through React:
 * the committed index is the single state change, handed back once the pane
 * has settled.
 *
 * A negative delta (dragging up, or left) always advances to the next index,
 * which matches both the vertical video feed and the media carousel inside a
 * post.
 */

/** Ignore jitter before deciding the gesture belongs to this axis. */
const AXIS_LOCK_PX = 10;
/** Share of a pane that has to be dragged for a lazy release to commit. */
const COMMIT_RATIO = 0.25;
/** px/ms past which a short flick commits anyway. */
const COMMIT_VELOCITY = 0.45;
/** Samples closer together than this carry too much noise to time a flick by. */
const VELOCITY_SAMPLE_MS = 8;
/** Pull felt when dragging past the first/last pane. */
const OVERSCROLL_FACTOR = 0.18;
const SETTLE_EASING = "cubic-bezier(.22,.7,.25,1)";
const SETTLE_MIN_MS = 180;
const SETTLE_MAX_MS = 400;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  lastMain: number;
  lastTime: number;
  velocity: number;
  axis: "unknown" | "main" | "cross";
  size: number;
  target: number | null;
  moved: boolean;
};

type DragPagerOptions = {
  axis: "x" | "y";
  index: number;
  count: number;
  /** Track transform for an index, shifted by a live drag in px. */
  transform: (index: number, drag: number) => string;
  onIndexChange: (index: number) => void;
  /** Targets whose own gestures must win, such as a zoomed photo or a slider. */
  reservedSelector?: string;
  /** Fired once a drag has actually moved, so the following tap can be eaten. */
  onDragged?: () => void;
  enabled?: boolean;
};

export function useDragPager({
  axis,
  index,
  count,
  transform,
  onIndexChange,
  reservedSelector,
  onDragged,
  enabled = true,
}: DragPagerOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const paint = (drag: number, transition: string) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = transition;
    track.style.transform = transform(index, drag);
  };

  // Whatever index React settled on wins, unless a gesture currently owns the
  // track. Running on every render keeps the two in sync without the track
  // transform living in a style prop that could fight a drag mid-frame.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || busyRef.current) return;
    track.style.transform = transform(index, 0);
  });

  useLayoutEffect(() => () => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
  }, []);

  const mainOf = (event: { clientX: number; clientY: number }, gesture: Gesture) =>
    axis === "x" ? event.clientX - gesture.startX : event.clientY - gesture.startY;
  const crossOf = (event: { clientX: number; clientY: number }, gesture: Gesture) =>
    axis === "x" ? event.clientY - gesture.startY : event.clientX - gesture.startX;

  const offsetFor = (gesture: Gesture, main: number) =>
    gesture.target === null
      ? main * OVERSCROLL_FACTOR
      : Math.max(-gesture.size, Math.min(gesture.size, main));

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.pointerType === "mouse" || !event.isPrimary) return;
    if (gestureRef.current || busyRef.current) return;
    const target = event.target as HTMLElement;
    if (reservedSelector && target.closest(reservedSelector)) return;
    const track = trackRef.current;
    const size = axis === "x" ? track?.clientWidth ?? 0 : track?.clientHeight ?? 0;
    if (!size) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastMain: 0,
      lastTime: event.timeStamp,
      velocity: 0,
      axis: "unknown",
      size,
      target: null,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const main = mainOf(event, gesture);
    const cross = crossOf(event, gesture);

    if (gesture.axis === "unknown") {
      if (Math.abs(cross) > AXIS_LOCK_PX && Math.abs(cross) >= Math.abs(main)) {
        // The other axis owns this pointer; leave it to whoever handles it.
        gestureRef.current = null;
        return;
      }
      if (Math.abs(main) <= AXIS_LOCK_PX || Math.abs(main) <= Math.abs(cross)) return;
      gesture.axis = "main";
      gesture.moved = true;
      busyRef.current = true;
      // Velocity is measured from the lock point, so the slack spent deciding
      // the axis cannot be mistaken for a flick.
      gesture.lastMain = main;
      gesture.lastTime = event.timeStamp;
      onDragged?.();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is a nicety; the gesture still tracks without it.
      }
    }

    const elapsed = event.timeStamp - gesture.lastTime;
    if (elapsed >= VELOCITY_SAMPLE_MS) {
      const instant = (main - gesture.lastMain) / elapsed;
      gesture.velocity = gesture.velocity * 0.7 + instant * 0.3;
      gesture.lastMain = main;
      gesture.lastTime = event.timeStamp;
    }

    const wanted = main < 0 ? index + 1 : index - 1;
    gesture.target = wanted >= 0 && wanted < count ? wanted : null;
    paint(offsetFor(gesture, main), "none");
  };

  const endGesture = (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (gesture.axis !== "main") return;

    const main = mainOf(event, gesture);
    const offset = offsetFor(gesture, main);
    const flicked =
      Math.abs(gesture.velocity) > COMMIT_VELOCITY &&
      Math.sign(gesture.velocity) === Math.sign(main);
    const commit =
      !cancelled &&
      gesture.target !== null &&
      (Math.abs(offset) > gesture.size * COMMIT_RATIO || flicked);
    const target = gesture.target;
    const destination = commit && target !== null ? Math.sign(main) * gesture.size : 0;
    const duration = Math.min(
      SETTLE_MAX_MS,
      Math.max(SETTLE_MIN_MS, Math.abs(destination - offset) / Math.max(Math.abs(gesture.velocity), 0.6)),
    );

    paint(destination, `transform ${duration}ms ${SETTLE_EASING}`);

    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      busyRef.current = false;
      if (trackRef.current) trackRef.current.style.transition = "";
      if (commit && target !== null) onIndexChange(target);
      // The layout effect re-syncs the track to whatever index React holds, so
      // a refused commit lands back on the pane that is actually showing.
      else if (trackRef.current) trackRef.current.style.transform = transform(index, 0);
    }, duration + 20);
  };

  return {
    trackRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => endGesture(event, false),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => endGesture(event, true),
    },
  };
}
