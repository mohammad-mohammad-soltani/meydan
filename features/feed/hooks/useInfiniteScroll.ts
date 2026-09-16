"use client";

import { useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
  /** Attaches the observer only while there is something left to load. */
  enabled: boolean;
  onLoadMore: () => void;
  /**
   * Changes whenever the list grew. Re-attaching the observer makes a sentinel
   * that is still on screen fire again, so a short first page keeps filling the
   * viewport instead of waiting for a scroll that never happens.
   */
  revision?: number;
  /** How far below the scroll container's edge a load is triggered. */
  rootMargin?: string;
};

/**
 * The feed scrolls inside the app shell's `<main>`, not the window, so a
 * viewport-rooted observer would only fire once the sentinel had already been
 * scrolled past. Walk up to the real scroll container instead.
 */
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

/**
 * Watches a sentinel element at the end of a list and calls `onLoadMore` when
 * it approaches the visible area. Browsers without `IntersectionObserver` keep
 * working through the manual "load more" control the caller renders next to it.
 *
 * The returned value is a callback ref: keeping the node in state means the
 * observer re-attaches when the list (and therefore the sentinel) is remounted
 * by a tab or filter switch.
 */
export function useInfiniteScroll({
  enabled,
  onLoadMore,
  revision = 0,
  rootMargin = "600px",
}: UseInfiniteScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // The observer is created once per sentinel; the ref keeps it calling the
  // latest callback without tearing the observer down on every render.
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinel || !enabled) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
      },
      { root: findScrollParent(sentinel), rootMargin, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, revision, rootMargin, sentinel]);

  return setSentinel;
}
