"use client";

import { useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
  enabled: boolean;
  onLoadMore: () => void;
  /** Re-arm the observer when the rendered list grows. */
  revision?: number;
  /** How early the next page should start loading. */
  rootMargin?: string;
};

function findScrollParent(node: HTMLElement): HTMLElement | null {
  let parent = node.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function fallbackDistance(rootMargin: string): number {
  const value = Number.parseInt(rootMargin, 10);
  return Number.isFinite(value) ? Math.max(0, value) : 1200;
}

/**
 * Prefetches the next timeline page before the user reaches the end. The app
 * shell scrolls inside its own <main>, so the observer is rooted at the actual
 * scroll container. A throttled scroll fallback keeps older browsers working.
 */
export function useInfiniteScroll({
  enabled,
  onLoadMore,
  revision = 0,
  rootMargin = "1200px 0px",
}: UseInfiniteScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinel || !enabled) return;

    const root = findScrollParent(sentinel);

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            onLoadMoreRef.current();
          }
        },
        { root, rootMargin, threshold: 0 },
      );

      observer.observe(sentinel);
      return () => observer.disconnect();
    }

    const threshold = fallbackDistance(rootMargin);
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;

    const check = () => {
      frame = 0;
      const remaining = sentinel.getBoundingClientRect().top -
        (root ? root.getBoundingClientRect().bottom : window.innerHeight);
      if (remaining <= threshold) onLoadMoreRef.current();
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(check);
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    check();

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled, revision, rootMargin, sentinel]);

  return setSentinel;
}
