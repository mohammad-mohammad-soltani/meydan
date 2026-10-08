"use client";

import { useEffect, useRef } from "react";
import { readStoredTheme } from "@/lib/theme";

/** Matches the inline bootstrap script's id/key in `app/layout.tsx`. */
const SPLASH_ROOT_ID = "meydan-splash";
const SPLASH_ANIM_ID = "meydan-splash-anim";
export const SPLASH_SESSION_KEY = "meydan-splash-shown";

/** Hard cap so a slow/broken animation can never trap the user behind the overlay. */
const FALLBACK_TIMEOUT_MS = 6000;

function splashSource(): string {
  // Only a light and a dark Lottie exist; the "black" theme reads closest to dark.
  return readStoredTheme() === "light" ? "/splash/splash-light.json" : "/splash/splash-dark.json";
}

function markShownAndRemove(root: HTMLElement | null) {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the overlay still gets removed below.
  }
  root?.remove();
}

/**
 * Plays the first-load splash animation left in the DOM by the inline
 * bootstrap script in `app/layout.tsx`, then removes it so the rest of the
 * app (already rendering underneath) becomes visible. Does nothing on
 * in-app navigations or repeat tab loads, where that script already removed
 * the overlay before this component ever mounts.
 */
export function SplashScreen() {
  const removedRef = useRef(false);

  useEffect(() => {
    const root = document.getElementById(SPLASH_ROOT_ID);
    const container = document.getElementById(SPLASH_ANIM_ID);
    if (!root || !container) return;

    let cancelled = false;
    const finish = () => {
      if (removedRef.current) return;
      removedRef.current = true;
      markShownAndRemove(root);
    };

    const fallback = window.setTimeout(finish, FALLBACK_TIMEOUT_MS);

    (async () => {
      try {
        const { default: lottie } = await import("lottie-web");
        if (cancelled) return;

        const anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: false,
          autoplay: true,
          path: splashSource(),
        });

        anim.addEventListener("complete", finish);
        anim.addEventListener("data_failed", finish);
      } catch {
        finish();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
