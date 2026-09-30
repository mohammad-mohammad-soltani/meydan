import type { AudioTrack } from "./types";

const POSITION_STORAGE_KEY = "meydan-audio-positions-v1";
export const POSITION_WRITE_INTERVAL_MS = 1000;
type StoredPosition = {
  url: string;
  time: number;
  updatedAt: number;
};

type StoredPositions = Record<string, StoredPosition>;

export type NativeAudioStateDetail = {
  trackId?: unknown;
  isPlaying?: unknown;
  isReady?: unknown;
  isBuffering?: unknown;
  currentTime?: unknown;
  duration?: unknown;
  didJustFinish?: unknown;
  error?: unknown;
};

type NaghshmanNativeWindow = Window & {
  NaghshmanNative?: {
    platform?: string;
    version?: number;
    capabilities?: {
      nativeAudioV1?: boolean;
    };
  };
  ReactNativeWebView?: {
    postMessage: (value: string) => void;
  };
};

export function nativeAudioBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const nativeWindow = window as NaghshmanNativeWindow;
  return Boolean(
    nativeWindow.NaghshmanNative?.capabilities?.nativeAudioV1 &&
    nativeWindow.ReactNativeWebView?.postMessage,
  );
}

export function postNativeAudio(payload: Record<string, unknown>): boolean {
  if (!nativeAudioBridgeAvailable()) return false;
  const nativeWindow = window as NaghshmanNativeWindow;
  try {
    nativeWindow.ReactNativeWebView?.postMessage(
      JSON.stringify({
        source: "naghshman-web",
        version: 1,
        ...payload,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function readStoredPositions(): StoredPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as StoredPositions)
      : {};
  } catch {
    return {};
  }
}

export function writeStoredPosition(track: AudioTrack, time: number) {
  if (typeof window === "undefined" || !Number.isFinite(time)) return;
  try {
    const positions = readStoredPositions();
    positions[track.id] = {
      url: track.url,
      time: Math.max(0, time),
      updatedAt: Date.now(),
    };

    const compactEntries = Object.entries(positions)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, 30);
    window.localStorage.setItem(
      POSITION_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(compactEntries)),
    );
  } catch {
    // Resume is progressive enhancement; playback must never depend on storage.
  }
}

export function effectiveDuration(
  audio: HTMLAudioElement,
  fallback?: number,
): number {
  if (Number.isFinite(audio.duration) && audio.duration > 0)
    return audio.duration;

  if (audio.seekable.length) {
    const end = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }

  return Number.isFinite(fallback) && (fallback ?? 0) > 0
    ? (fallback as number)
    : 0;
}

export function bufferedEnd(audio: HTMLAudioElement): number {
  if (!audio.buffered.length) return 0;
  const end = audio.buffered.end(audio.buffered.length - 1);
  return Number.isFinite(end) ? Math.max(0, end) : 0;
}
