"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `lg` breakpoint, where both desktop sidebars become visible. */
const DESKTOP_QUERY = "(min-width: 64rem)";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * True from the desktop breakpoint up. The desktop sidebars stay in the DOM on
 * small screens (CSS only hides them), so widgets that fetch should mount their
 * network work behind this instead of paying for a panel nobody can see. The
 * server snapshot is `false`, which hydrates cleanly and flips after mount.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
