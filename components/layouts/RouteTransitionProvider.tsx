"use client";

import type { MouseEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type RouteTransitionContextValue = {
  isTransitioning: boolean;
  pendingPath: string | null;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue>({
  isTransitioning: false,
  pendingPath: null,
});

const EXIT_DURATION_MS = 220;

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  const clearTransition = useCallback(() => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
    setPendingPath(null);
  }, []);

  useEffect(() => {
    if (pendingPath === pathname) clearTransition();
  }, [pathname, pendingPath, clearTransition]);

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
  }, []);

  const startTransition = useCallback((href: string) => {
    const destination = new URL(href, window.location.href);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${destination.pathname}${destination.search}${destination.hash}`;

    if (destination.origin !== window.location.origin || current === next || pendingPath) return false;

    setPendingPath(destination.pathname);
    transitionTimerRef.current = window.setTimeout(() => router.push(next), EXIT_DURATION_MS);
    return true;
  }, [pendingPath, router]);

  const handleLinkCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download") || link.dataset.routeTransition === "false") return;

    const rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#")) return;

    const destination = new URL(rawHref, window.location.href);
    if (destination.origin !== window.location.origin) return;

    if (startTransition(rawHref)) event.preventDefault();
  };

  return (
    <RouteTransitionContext.Provider value={{ isTransitioning: pendingPath !== null, pendingPath }}>
      <div className="contents" onClickCapture={handleLinkCapture}>{children}</div>
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}
