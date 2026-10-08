"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
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

function markShownAndHide(root: HTMLElement | null, anim: AnimationItem | null) {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the overlay still gets hidden below.
  }
  anim?.destroy();
  // Hidden, never removed: this node is rendered by React (in `app/layout.tsx`),
  // which persists across client-side navigations without re-rendering. Deleting
  // it with `.remove()` desyncs React's fiber tree from the real DOM, so the next
  // time React touches `<body>` (e.g. a route change) it throws trying to clean
  // up a child that is no longer there. Toggling a style React never sets itself
  // (it only sets position/inset/z-index/flex/background) is safe indefinitely.
  if (root) {
    root.style.display = "none";
    root.setAttribute("aria-hidden", "true");
  }
}

/**
 * Plays the first-load splash animation left in the DOM by the inline
 * bootstrap script in `app/layout.tsx`, then hides it so the rest of the
 * app (already rendering underneath) becomes visible. Does nothing on
 * in-app navigations or repeat tab loads, where that script already hid
 * the overlay before this component ever mounted.
 */
export function SplashScreen() {
  const finishedRef = useRef(false);

  useEffect(() => {
    const root = document.getElementById(SPLASH_ROOT_ID);
    const container = document.getElementById(SPLASH_ANIM_ID);
    if (!root || !container || root.style.display === "none") return;

    let cancelled = false;
    let anim: AnimationItem | null = null;
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      markShownAndHide(root, anim);
    };

    const fallback = window.setTimeout(finish, FALLBACK_TIMEOUT_MS);

    (async () => {
      try {
        // Both load in parallel (the JSON fetch reuses the <link rel="preload">
        // the layout's bootstrap script already started), so the animation
        // starts as soon as whichever one is slower finishes, not both in series.
        const [{ default: lottie }, animationData] = await Promise.all([
          import("lottie-web"),
          fetch(splashSource(), { cache: "force-cache" }).then((response) => response.json()),
        ]);
        if (cancelled) return;

        anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: false,
          autoplay: true,
          animationData,
          // Fills the full-viewport container edge to edge, like a native splash,
          // instead of letterboxing the 360x640 composition inside it.
          rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
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
