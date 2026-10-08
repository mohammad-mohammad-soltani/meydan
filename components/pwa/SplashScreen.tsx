"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import { readStoredTheme } from "@/lib/theme";

/** Matches the inline bootstrap script's id in `app/layout.tsx`. */
const SPLASH_ROOT_ID = "meydan-splash";
const SPLASH_ANIM_ID = "meydan-splash-anim";

/** Hard cap so a slow/broken animation can never trap the user behind the overlay. */
const FALLBACK_TIMEOUT_MS = 6000;

/** Matches the `transition` duration set on `#meydan-splash` in `app/layout.tsx`. */
const FADE_OUT_MS = 450;

function splashSource(): string {
  // Only a light and a dark Lottie exist; the "black" theme reads closest to dark.
  return readStoredTheme() === "light" ? "/splash/splash-light.json" : "/splash/splash-dark.json";
}

function hide(root: HTMLElement | null, anim: AnimationItem | null) {
  anim?.destroy();
  if (!root) return;

  // Fades + settles out instead of cutting straight to `display: none`, which
  // read as an abrupt jump cut once the animation itself finished.
  root.setAttribute("aria-hidden", "true");
  root.style.pointerEvents = "none";
  root.style.opacity = "0";
  root.style.transform = "scale(1.03)";

  // Hidden, never removed: this node is rendered by React (in `app/layout.tsx`),
  // which persists across client-side navigations without re-rendering. Deleting
  // it with `.remove()` desyncs React's fiber tree from the real DOM, so the next
  // time React touches `<body>` (e.g. a route change) it throws trying to clean
  // up a child that is no longer there. Toggling styles React never sets itself
  // (it only sets position/inset/z-index/flex/background/transition) is safe
  // indefinitely, same as the `display` flip below once the fade settles.
  window.setTimeout(() => {
    root.style.display = "none";
  }, FADE_OUT_MS);
}

/**
 * Plays the splash animation left in the DOM by the inline bootstrap script
 * in `app/layout.tsx`, then hides it so the rest of the app (already
 * rendering underneath) becomes visible.
 *
 * This mounts exactly once per real document load — a typed URL, a new tab,
 * or a refresh — because Next.js's root layout isn't remounted on
 * client-side navigation between pages. No "already shown" flag is needed to
 * skip it on in-app navigation: that case simply never reaches this effect.
 */
export function SplashScreen() {
  const finishedRef = useRef(false);

  useEffect(() => {
    const root = document.getElementById(SPLASH_ROOT_ID);
    const container = document.getElementById(SPLASH_ANIM_ID);
    if (!root || !container) return;

    let cancelled = false;
    let anim: AnimationItem | null = null;
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      hide(root, anim);
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
          // "meet" (contain, lottie-web's default) keeps the whole 360x640
          // composition in frame at any viewport shape. "slice" (cover) was
          // tried for an edge-to-edge look, but on a wide desktop window it
          // crops down to a zoomed sliver of the vertical center, cutting off
          // the logo and progress bar entirely — worse than a few pixels of
          // letterboxing, which blends into the matching background color.
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
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
