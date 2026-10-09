"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";

/**
 * Finger-tracked pager for the timeline tabs.
 *
 * Panes are ordered right-to-left, so index 0 is the right-most pane and the
 * neighbour at index + 1 sits to its left: dragging the content to the right
 * pulls the next pane in, exactly like the RTL tab strip reads.
 *
 * Nothing in the gesture goes through React. Neighbour panes stay mounted and
 * hidden, and every frame of the drag is a direct style write on three nodes —
 * the moving track, the incoming pane and the tab underline — so the feed list
 * is never re-rendered mid-swipe. State only changes once, after the pane has
 * settled, when the committed tab is handed back to the caller.
 *
 * Only the active pane lives in the document flow, owning the page height and
 * the scroll position. Neighbours are drawn in viewport-sized fixed layers, so
 * releasing a drag without committing leaves both completely untouched.
 */

/** Ignore jitter before deciding the gesture belongs to us. */
const AXIS_LOCK_PX = 10;
/** Share of the pane width that has to be dragged for a lazy release to commit. */
const COMMIT_RATIO = 0.3;
/** Samples closer together than this carry too much noise to time a flick by. */
const VELOCITY_SAMPLE_MS = 8;
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

/** Pins a sliding layer over the pane area and parks it just off-screen. */
function parkLayer(layer: HTMLElement | null, pane: HTMLElement | null, box: { left: number; width: number; top: number }, rest: number) {
  if (layer) {
    layer.style.left = `${box.left}px`;
    layer.style.width = `${box.width}px`;
    layer.style.top = `${box.top}px`;
    layer.style.height = `${Math.max(0, window.innerHeight - box.top)}px`;
    layer.style.visibility = "hidden";
  }
  if (pane) {
    pane.style.transition = "";
    pane.style.transform = `translate3d(${rest}px, 0, 0)`;
    pane.style.willChange = "transform";
  }
}

function moveLayer(layer: HTMLElement | null, pane: HTMLElement | null, visible: boolean, offset: number) {
  if (layer) layer.style.visibility = visible ? "visible" : "hidden";
  if (visible && pane) pane.style.transform = `translate3d(${offset}px, 0, 0)`;
}

function resetLayer(layer: HTMLElement | null, pane: HTMLElement | null) {
  if (layer) layer.style.visibility = "hidden";
  if (pane) {
    pane.style.transition = "";
    pane.style.willChange = "";
  }
}

/**
 * A horizontally scrolling rail inside a pane (banners, cards, chips) has its
 * own `touch-action`, so the browser hands it every sideways pan and cancels
 * our pointer stream — the pager would be dead under half the page. A rail
 * can only use a pan in the directions it still has content to scroll to, so
 * the opposite direction is withheld from it and falls through to the pager.
 * `pan-left`/`pan-right` are what the browser has to be told *before* the
 * touch starts, hence this is kept up to date from scroll events rather than
 * decided mid-gesture.
 */
function syncRailTouchAction(rail: HTMLElement) {
  const max = rail.scrollWidth - rail.clientWidth;
  if (max <= 1) return;
  const rtl = getComputedStyle(rail).direction === "rtl";
  // Distance from the physical left edge, regardless of the scroll origin.
  const fromLeft = rtl ? rail.scrollLeft + max : rail.scrollLeft;
  const actions = ["pan-y"];
  // The keywords name the direction the *viewport* pans, not the finger.
  if (fromLeft > 1) actions.push("pan-left"); // finger moves right: reveals content on the left
  if (fromLeft < max - 1) actions.push("pan-right"); // finger moves left: reveals content on the right
  rail.style.touchAction = actions.join(" ");
}

function isRail(node: HTMLElement) {
  if (node.scrollWidth <= node.clientWidth + 1) return false;
  const overflowX = getComputedStyle(node).overflowX;
  return overflowX === "auto" || overflowX === "scroll";
}

/** Weight of a tab's label for a pager position that can sit between two panes: 1 on its own pane, fading to 0 a pane away. */
const labelWeight = (tab: number, position: number) => Math.max(0, 1 - Math.abs(tab - position));

/**
 * Blends a label from its resting colour to its active one by `weight`, so the
 * title darkens and lightens in step with the finger instead of flipping once
 * the pane has landed.
 */
function paintLabels(labels: ArrayLike<HTMLElement> | null, position: number) {
  if (!labels) return;
  for (let tab = 0; tab < labels.length; tab++) {
    const weight = labelWeight(tab, position);
    labels[tab].style.color = `color-mix(in srgb, var(--foreground) ${(weight * 100).toFixed(1)}%, var(--muted-foreground))`;
    // Tabs that grow an icon read the same weight through this property.
    labels[tab].style.setProperty("--tab-w", weight.toFixed(3));
    // A tab may carry its own underline that grows with the same weight.
    const rule = labels[tab].querySelector<HTMLElement>("[data-tab-rule]");
    if (rule) rule.style.scale = `${weight.toFixed(3)} 1`;
  }
}

function setLabelTransition(labels: ArrayLike<HTMLElement> | null, transition: string) {
  if (!labels) return;
  for (let tab = 0; tab < labels.length; tab++) {
    // `--tab-w` is a registered number (see globals.css), so it eases like any other property.
    labels[tab].style.transition = transition === "none" ? transition : `${transition}, --tab-w ${transition.split(" ")[1]} ${transition.split(" ").slice(2).join(" ")}`;
    const rule = labels[tab].querySelector<HTMLElement>("[data-tab-rule]");
    if (rule) rule.style.transition = transition.replace(/^color/, "scale");
  }
}

function clearLabels(labels: ArrayLike<HTMLElement> | null) {
  if (!labels) return;
  for (let tab = 0; tab < labels.length; tab++) {
    labels[tab].style.color = "";
    labels[tab].style.transition = "";
    labels[tab].style.removeProperty("--tab-w");
    const rule = labels[tab].querySelector<HTMLElement>("[data-tab-rule]");
    if (rule) {
      rule.style.scale = "";
      rule.style.transition = "";
    }
  }
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
  /** Pane being pulled in, resolved on the first horizontal move. */
  target: number | null;
};

type FeedSwipePagerProps = {
  index: number;
  count: number;
  onIndexChange: (index: number) => void;
  /** Pane for a neighbouring index; mounted hidden until a drag reveals it. */
  renderPane: (index: number) => ReactNode;
  /** Sticky element the sliding layers must stay below (the tab strip). */
  topBoundaryRef: RefObject<HTMLElement | null>;
  /** Resolves the tab underline, which is moved in step with the finger. */
  getIndicator?: () => HTMLElement | null;
  /** Resolves the tab titles in pane order; their colour is blended with the drag. */
  getLabels?: () => ArrayLike<HTMLElement> | null;
  children: ReactNode;
};

export function FeedSwipePager({
  index,
  count,
  onIndexChange,
  renderPane,
  topBoundaryRef,
  getIndicator,
  getLabels,
  children,
}: FeedSwipePagerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // One layer per side the active pane can be pulled away from: -1 rests to
  // its left (the next index in RTL order), 1 rests to its right.
  const leftLayerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightLayerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const syncAll = () => {
      frame = 0;
      for (const node of track.querySelectorAll<HTMLElement>("*")) {
        if (isRail(node)) syncRailTouchAction(node);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(syncAll);
    };
    const onScroll = (event: Event) => {
      const node = event.target;
      if (node instanceof HTMLElement && node !== track && isRail(node)) syncRailTouchAction(node);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(track, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    // `scroll` doesn't bubble, but it does capture.
    track.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      track.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  const sideOf = (target: number) => (target > index ? -1 : 1);

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

  /**
   * Geometry and layer promotion are resolved once per gesture, before the
   * finger has moved, so no frame of the drag pays for a measurement.
   */
  const prepare = useCallback((width: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const boundary = topBoundaryRef.current?.getBoundingClientRect();
    const top = Math.max(rect.top, boundary?.bottom ?? 0);

    const box = { left: rect.left, width: rect.width, top };
    parkLayer(leftLayerRef.current, leftPaneRef.current, box, -width);
    parkLayer(rightLayerRef.current, rightPaneRef.current, box, width);
    if (trackRef.current) trackRef.current.style.willChange = "transform";
  }, [topBoundaryRef]);

  const paint = useCallback((offset: number, target: number | null, width: number) => {
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${offset}px, 0, 0)`;

    const side = target === null ? 0 : sideOf(target);
    moveLayer(leftLayerRef.current, leftPaneRef.current, side === -1, offset - width);
    moveLayer(rightLayerRef.current, rightPaneRef.current, side === 1, offset + width);

    const indicator = getIndicator?.() ?? null;
    if (indicator) {
      const progress = target === null ? 0 : (Math.abs(offset) / width) * (target - index);
      indicator.style.transform = `translateX(${-(index + progress) * 100}%)`;
    }
    paintLabels(getLabels?.() ?? null, index + (target === null ? 0 : (Math.abs(offset) / width) * (target - index)));
    // `sideOf` only reads the render-scoped `index`, which paint already depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getIndicator, getLabels, index]);

  const release = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = "";
      trackRef.current.style.transform = "";
      trackRef.current.style.willChange = "";
    }
    resetLayer(leftLayerRef.current, leftPaneRef.current);
    resetLayer(rightLayerRef.current, rightPaneRef.current);
    // The transform stays: paint() already left the underline on the pane that
    // won, and clearing it would snap the underline back to the first tab when
    // a drag is released without committing.
    const indicator = getIndicator?.() ?? null;
    if (indicator) indicator.style.transition = "";
    // The committed tab's own classes take over from here; both resolve to the same colour.
    clearLabels(getLabels?.() ?? null);
  }, [getIndicator, getLabels]);

  const settle = useCallback((offset: number, target: number | null, commit: boolean, velocity: number, width: number) => {
    const side = target === null ? 0 : sideOf(target);
    const destination = commit && target !== null ? -side * width : 0;
    const distance = Math.abs(destination - offset);
    const duration = Math.min(SETTLE_MAX_MS, Math.max(SETTLE_MIN_MS, distance / Math.max(Math.abs(velocity), 0.6)));
    const easing = `transform ${duration}ms ${SETTLE_EASING}`;

    if (trackRef.current) trackRef.current.style.transition = easing;
    if (target !== null && side === -1 && leftPaneRef.current) leftPaneRef.current.style.transition = easing;
    if (target !== null && side === 1 && rightPaneRef.current) rightPaneRef.current.style.transition = easing;
    const indicator = getIndicator?.() ?? null;
    if (indicator) indicator.style.transition = easing;
    setLabelTransition(getLabels?.() ?? null, `color ${duration}ms ${SETTLE_EASING}`);

    // The drag already painted the start value in an earlier frame, so the
    // destination can be applied straight away and still animate.
    paint(destination, target, width);

    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      if (commit && target !== null) alignToPaneTop();
      release();
      if (commit && target !== null) onIndexChange(target);
    }, duration + 20);
    // `sideOf` only reads the render-scoped `index`, which settle already depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignToPaneTop, getIndicator, getLabels, index, onIndexChange, paint, release]);

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
      target: null,
    };
    prepare(width);
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
        release();
        return;
      }
      if (Math.abs(dx) <= AXIS_LOCK_PX || Math.abs(dx) <= Math.abs(dy)) return;
      gesture.axis = "x";
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture is a nicety; the gesture still tracks without it.
      }
      // Velocity is measured from the lock point, so the slack spent deciding
      // the axis cannot be mistaken for a flick.
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
      const indicator = getIndicator?.() ?? null;
      if (indicator) indicator.style.transition = "none";
      setLabelTransition(getLabels?.() ?? null, "none");
    }

    const elapsed = event.timeStamp - gesture.lastTime;
    if (elapsed >= VELOCITY_SAMPLE_MS) {
      const instant = (event.clientX - gesture.lastX) / elapsed;
      gesture.velocity = gesture.velocity * 0.7 + instant * 0.3;
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
    }

    // Dragging right reveals the pane to the left, which is the next index.
    const wanted = dx > 0 ? index + 1 : index - 1;
    gesture.target = wanted >= 0 && wanted < count ? wanted : null;
    const offset = gesture.target === null
      ? dx * OVERSCROLL_FACTOR
      : Math.max(-gesture.width, Math.min(gesture.width, dx));

    paint(offset, gesture.target, gesture.width);
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (gesture.axis !== "x") {
      release();
      return;
    }

    const dx = event.clientX - gesture.startX;
    const target = gesture.target;
    const offset = target === null
      ? dx * OVERSCROLL_FACTOR
      : Math.max(-gesture.width, Math.min(gesture.width, dx));
    const flicked = Math.abs(gesture.velocity) > COMMIT_VELOCITY && Math.sign(gesture.velocity) === Math.sign(dx);
    const commit = !cancelled && target !== null && (Math.abs(offset) > gesture.width * COMMIT_RATIO || flicked);

    settle(offset, target, commit, gesture.velocity, gesture.width);
  };

  return (
    <div ref={rootRef} className="relative w-full" style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endGesture(event, false)}
      onPointerCancel={(event) => endGesture(event, true)}
    >
      <div ref={trackRef} className="w-full">
        {children}
      </div>
      {index + 1 < count ? (
        <SlidingLayer layerRef={leftLayerRef} paneRef={leftPaneRef}>{renderPane(index + 1)}</SlidingLayer>
      ) : null}
      {index - 1 >= 0 ? (
        <SlidingLayer layerRef={rightLayerRef} paneRef={rightPaneRef}>{renderPane(index - 1)}</SlidingLayer>
      ) : null}
    </div>
  );
}

function SlidingLayer({
  layerRef,
  paneRef,
  children,
}: {
  layerRef: RefObject<HTMLDivElement | null>;
  paneRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed z-20 overflow-clip"
      style={{ visibility: "hidden", contain: "paint" }}
    >
      {/* Only the sliding pane is opaque — the layer itself stays transparent
          so the outgoing timeline shows sliding away underneath it. */}
      <div ref={paneRef} className="h-full w-full flow-root overflow-clip bg-background">
        {children}
      </div>
    </div>
  );
}
