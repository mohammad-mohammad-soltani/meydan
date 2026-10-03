"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Trails the active desktop-sidebar link with a background pill instead of
 * the highlight popping straight into place. Position is measured from the
 * DOM (rather than indexed) because the link list grows an admin entry
 * asynchronously once the viewer role resolves.
 */
export function DesktopNavIndicator({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [style, setStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const frameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const update = () => {
      const container = containerRef.current;
      const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) {
        setStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      setStyle({ top: active.offsetTop, height: active.offsetHeight, opacity: 1 });
    };

    // The nav element's own ref attaches after this child's layout effect
    // runs (refs commit bottom-up), so the container isn't available yet
    // synchronously — defer one frame to let it settle.
    const setupFrame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      update();
      observer = new ResizeObserver(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(update);
      });
      observer.observe(container);
      mutationObserver = new MutationObserver(update);
      mutationObserver.observe(container, { attributes: true, subtree: true, attributeFilter: ["aria-current"], childList: true });
    });

    return () => {
      cancelAnimationFrame(setupFrame);
      observer?.disconnect();
      mutationObserver?.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [containerRef]);

  return (
    <span
      aria-hidden
      className="nav-indicator-pill pointer-events-none absolute start-0 z-0 w-full rounded-2xl bg-brand-muted"
      style={{ insetBlockStart: style.top, height: style.height, opacity: style.opacity }}
    />
  );
}
