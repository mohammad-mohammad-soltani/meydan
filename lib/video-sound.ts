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

/* -------------------------------------------------------------------------- */
/* Handoff autoplay session                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Once the reader has started a video and then scrolls on, the timeline keeps
 * playing whatever enters the viewport — the video that scrolled away paused
 * itself, and the next one to arrive picks the sound up.
 *
 * The session is deliberately easy to end and hard to start, because an
 * unexpected autoplay is far worse than a missing one:
 *
 *   - it starts only from a real user gesture on a player (`beginVideoAutoplay`)
 *   - it ends the moment the reader pauses or mutes a video by hand, so the
 *     app never fights an explicit "stop"
 *   - it also ends on its own after {@link VIDEO_AUTOPLAY_IDLE_MS} without a
 *     handoff, so a session never outlives the browsing it belongs to
 *
 * Only a user gesture starts it. A video that merely played on its own (the
 * lightbox's `autoPlay`) does not opt the whole timeline into autoplay.
 */
export const VIDEO_AUTOPLAY_IDLE_MS = 45_000;

/** Fired on `window` whenever the session starts or stops. */
export const VIDEO_AUTOPLAY_CHANGE_EVENT = "meydan-video-autoplay-change";

type AutoplayListener = (armed: boolean) => void;

let autoplayTimer: ReturnType<typeof setTimeout> | null = null;
const autoplayListeners = new Set<AutoplayListener>();

function clearAutoplayTimer(): void {
  if (autoplayTimer !== null) {
    clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }
}

function notifyAutoplay(armed: boolean): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<boolean>(VIDEO_AUTOPLAY_CHANGE_EVENT, { detail: armed }));
  }
  for (const listener of autoplayListeners) listener(armed);
}

function armAutoplayIdleTimer(): void {
  if (typeof window === "undefined") return;

  clearAutoplayTimer();
  autoplayTimer = setTimeout(() => {
    autoplayTimer = null;
    notifyAutoplay(false);
  }, VIDEO_AUTOPLAY_IDLE_MS);
}

/** Ends the session from inside this module, without re-entering the timer. */
export function isVideoAutoplayActive(): boolean {
  return autoplayTimer !== null;
}

/**
 * Starts (or extends) the session. Call this only from a genuine user gesture:
 * a click on the play button, the video surface or the keyboard shortcut.
 */
export function beginVideoAutoplay(): void {
  if (typeof window === "undefined") return;

  const wasActive = autoplayTimer !== null;
  armAutoplayIdleTimer();
  if (!wasActive) notifyAutoplay(true);
}

/** Ends the session, so nothing autoplays again until the reader asks. */
export function stopVideoAutoplay(): void {
  const wasActive = autoplayTimer !== null;
  clearAutoplayTimer();
  if (wasActive) notifyAutoplay(false);
}

export function onVideoAutoplayChange(listener: AutoplayListener): () => void {
  autoplayListeners.add(listener);
  return () => {
    autoplayListeners.delete(listener);
  };
}

/**
 * Called when a player hands playback on to the next one: the session stays
 * alive but its idle window starts over, so a long stretch of timeline keeps
 * playing for as long as the reader keeps scrolling.
 */
export function continueVideoAutoplay(): void {
  if (autoplayTimer === null) return;
  armAutoplayIdleTimer();
}

/** `useSyncExternalStore` adapters; the server snapshot is always inactive. */
export function subscribeToVideoAutoplay(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  return onVideoAutoplayChange(() => listener());
}

export function videoAutoplaySnapshot(): boolean {
  return isVideoAutoplayActive();
}

export function videoAutoplayServerSnapshot(): boolean {
  return false;
}

/* -------------------------------------------------------------------------- */
/* Player registry                                                             */
/* -------------------------------------------------------------------------- */

export type RegisteredPlayer = {
  /** The player frame, used to measure where it sits in the viewport. */
  element: HTMLElement;
  video: HTMLVideoElement;
};

const playerRegistry = new WeakMap<HTMLElement, HTMLVideoElement>();

/**
 * Players that are playing because of the handoff rather than because the
 * reader pressed play. Used both to hand playback on and to stand down.
 */
export const handoffHolders = new WeakMap<HTMLVideoElement, (value: boolean) => void>();

/**
 * Registers a mounted player so the handoff logic can see its siblings — to
 * pick the one nearest the middle of the screen, and to make sure only one
 * video is ever playing at a time. The returned function unregisters it.
 */
export function registerPlayer(
  element: HTMLElement,
  video: HTMLVideoElement,
  onPlay: () => void,
): () => void {
  playerRegistry.set(element, video);
  video.addEventListener("play", onPlay);

  return () => {
    video.removeEventListener("play", onPlay);
    playerRegistry.delete(element);
    handoffHolders.delete(video);
  };
}

/** Every player currently mounted, in document order. */
export function listPlayers(): RegisteredPlayer[] {
  if (typeof document === "undefined") return [];

  const players: RegisteredPlayer[] = [];
  for (const element of document.querySelectorAll<HTMLElement>("[data-video-player]")) {
    const video = element.querySelector("video") ?? playerRegistry.get(element);
    if (video) players.push({ element, video });
  }
  return players;
}
