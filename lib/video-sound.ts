/**
 * The app-wide video sound preference.
 *
 * Video playback lives in many places (timeline cards, post pages, content
 * pages, chat, the lightbox) and every one of them renders its own
 * `<video>` element. Without a shared source of truth, muting one player
 * left every other player audible. This module is that source of truth:
 * one persisted preference, one change event, and one broadcast helper that
 * pushes the preference onto every video currently in the document.
 */

export const VIDEO_MUTED_STORAGE_KEY = "meydan-video-muted";

/** Fired on `window` whenever any player toggles the shared preference. */
export const VIDEO_MUTED_CHANGE_EVENT = "meydan-video-muted-change";

type Listener = (muted: boolean) => void;

const listeners = new Set<Listener>();

export function normalizeVideoMuted(value: unknown): boolean {
  return value === true || value === "true";
}

/** Default is unmuted: sound is the expected behaviour for a tapped video. */
export function readStoredVideoMuted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return normalizeVideoMuted(window.localStorage.getItem(VIDEO_MUTED_STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Subscribes to preference changes; returns the unsubscribe function. */
export function onVideoMutedChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Applies `muted` to every `<video>` in the document, so a toggle lands on
 * players that are mounted elsewhere on the page right away. Elements that
 * mount later pick the value up when they read the stored preference.
 */
export function applyVideoMutedToDocument(muted: boolean): void {
  if (typeof document === "undefined") return;

  for (const video of document.querySelectorAll("video")) {
    video.muted = muted;
  }
}

/**
 * Sets, persists and broadcasts the shared preference. Returns the value that
 * was actually stored so callers can render from the truth rather than from
 * the value they hoped for.
 */
export function setVideoMuted(muted: boolean, persist = true): boolean {
  const next = normalizeVideoMuted(muted);

  if (typeof window !== "undefined") {
    if (persist) {
      try {
        window.localStorage.setItem(VIDEO_MUTED_STORAGE_KEY, next ? "true" : "false");
      } catch {
        // Persistence is best-effort; the in-memory broadcast still applies.
      }
    }

    applyVideoMutedToDocument(next);
    window.dispatchEvent(new CustomEvent<boolean>(VIDEO_MUTED_CHANGE_EVENT, { detail: next }));
  }

  for (const listener of listeners) listener(next);
  return next;
}

/** Flips the current preference and returns the new value. */
export function toggleVideoMuted(): boolean {
  return setVideoMuted(!readStoredVideoMuted());
}

/**
 * `useSyncExternalStore` adapter. The server snapshot is `false` so SSR and
 * the first hydration pass agree; the stored value arrives immediately after.
 */
export function subscribeToVideoMuted(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  return onVideoMutedChange(() => listener());
}

export function videoMutedSnapshot(): boolean {
  return readStoredVideoMuted();
}

export function videoMutedServerSnapshot(): boolean {
  return false;
}
