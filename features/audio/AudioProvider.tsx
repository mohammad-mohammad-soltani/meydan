"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AudioState, AudioTrack, PlayTrackOptions } from "./types";

const POSITION_STORAGE_KEY = "meydan-audio-positions-v1";
const POSITION_WRITE_INTERVAL_MS = 1000;
const ANALYSER_BAR_COUNT = 24;

const initialState: AudioState = {
  currentTrack: null,
  isPlaying: false,
  isReady: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  error: null,
  levels: [],
  queue: [],
};

type StoredPosition = {
  url: string;
  time: number;
  updatedAt: number;
};

type StoredPositions = Record<string, StoredPosition>;

type AudioContextValue = AudioState & {
  hasNext: boolean;
  hasPrevious: boolean;
  playTrack: (track: AudioTrack, options?: PlayTrackOptions) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (seconds: number) => void;
  seekBy: (seconds: number) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setQueue: (queue: AudioTrack[]) => void;
  clear: () => void;
};

const GlobalAudioContext = createContext<AudioContextValue | null>(null);

function readStoredPositions(): StoredPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as StoredPositions) : {};
  } catch {
    return {};
  }
}

function writeStoredPosition(track: AudioTrack, time: number) {
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

function effectiveDuration(audio: HTMLAudioElement, fallback?: number): number {
  if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;

  if (audio.seekable.length) {
    const end = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }

  return Number.isFinite(fallback) && (fallback ?? 0) > 0 ? (fallback as number) : 0;
}

function bufferedEnd(audio: HTMLAudioElement): number {
  if (!audio.buffered.length) return 0;
  const end = audio.buffered.end(audio.buffered.length - 1);
  return Number.isFinite(end) ? Math.max(0, end) : 0;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const trackRef = useRef<AudioTrack | null>(null);
  const queueRef = useRef<AudioTrack[]>([]);
  const playTrackRef = useRef<
    ((track: AudioTrack, options?: PlayTrackOptions) => Promise<void>) | null
  >(null);
  const pendingRestoreRef = useRef(false);
  const lastPositionWriteRef = useRef(0);
  const [state, setState] = useState<AudioState>(initialState);

  const stopAnalyserLoop = useCallback(() => {
    if (analyserFrameRef.current !== null) {
      cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
    }
  }, []);

  const startAnalyserLoop = useCallback(() => {
    if (analyserFrameRef.current !== null) return;
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frameCount = 0;

    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused || audio.ended) {
        analyserFrameRef.current = null;
        return;
      }

      analyser.getByteFrequencyData(data);
      frameCount += 1;
      if (frameCount % 2 === 0) {
        const step = Math.max(1, Math.floor(data.length / ANALYSER_BAR_COUNT));
        const levels = Array.from({ length: ANALYSER_BAR_COUNT }, (_, index) => {
          const value = data[Math.min(data.length - 1, index * step)] ?? 0;
          return Math.max(10, Math.round((value / 255) * 100));
        });
        setState((current) => ({ ...current, levels }));
      }

      analyserFrameRef.current = requestAnimationFrame(tick);
    };

    analyserFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    let context = audioContextRef.current;
    let analyser = analyserRef.current;

    if (!context || !analyser) {
      context = new AudioContextClass();
      analyser = context.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }

    if (context.state !== "running") await context.resume();
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !trackRef.current) return;

    setState((current) => ({ ...current, error: null }));

    try {
      await ensureAudioGraph();
    } catch {
      // The analyser is progressive enhancement. Native audio remains usable.
    }

    try {
      await audio.play();
      startAnalyserLoop();
    } catch {
      setState((current) => ({
        ...current,
        isPlaying: false,
        error: "مرورگر نتوانست پخش صوت را شروع کند. دوباره تلاش کنید.",
      }));
    }
  }, [ensureAudioGraph, startAnalyserLoop]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const setQueue = useCallback((queue: AudioTrack[]) => {
    queueRef.current = queue;
    setState((current) => ({ ...current, queue }));
  }, []);

  const playTrack = useCallback(
    async (track: AudioTrack, options: PlayTrackOptions = {}) => {
      const audio = audioRef.current;
      if (!audio || !track.url) return;

      const isDifferentTrack =
        trackRef.current?.id !== track.id || trackRef.current?.url !== track.url;

      if (options.queue) {
        queueRef.current = options.queue;
      } else if (!queueRef.current.some((candidate) => candidate.id === track.id)) {
        queueRef.current = [track];
      }

      if (isDifferentTrack) {
        audio.pause();
        trackRef.current = track;
        pendingRestoreRef.current = !options.restart;
        lastPositionWriteRef.current = 0;

        setState((current) => ({
          ...current,
          currentTrack: track,
          currentTime: 0,
          duration: track.duration ?? 0,
          buffered: 0,
          isReady: false,
          isPlaying: false,
          error: null,
          levels: [],
          queue: queueRef.current,
        }));

        audio.src = track.url;
        audio.load();
      } else if (options.restart) {
        pendingRestoreRef.current = false;
        audio.currentTime = 0;
        setState((current) => ({ ...current, currentTime: 0 }));
      } else {
        setState((current) => ({
          ...current,
          currentTrack: track,
          queue: queueRef.current,
          error: null,
        }));
      }

      if (options.autoplay !== false) await play();
    },
    [play],
  );

  playTrackRef.current = playTrack;

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;

    const duration = effectiveDuration(audio, trackRef.current?.duration);
    const nextTime = Math.max(0, duration > 0 ? Math.min(duration, seconds) : seconds);

    try {
      audio.currentTime = nextTime;
      setState((current) => ({ ...current, currentTime: nextTime }));
    } catch {
      // Some browsers reject seeking before metadata is ready. The slider stays usable
      // as soon as loadedmetadata/durationchange arrives.
    }
  }, []);

  const seekBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seek((Number.isFinite(audio.currentTime) ? audio.currentTime : 0) + seconds);
    },
    [seek],
  );

  const next = useCallback(async () => {
    const currentTrack = trackRef.current;
    if (!currentTrack) return;
    const queue = queueRef.current;
    const index = queue.findIndex((track) => track.id === currentTrack.id);
    const nextTrack = index >= 0 ? queue[index + 1] : undefined;
    if (nextTrack) await playTrack(nextTrack, { queue });
  }, [playTrack]);

  const previous = useCallback(async () => {
    const audio = audioRef.current;
    const currentTrack = trackRef.current;
    if (!audio || !currentTrack) return;

    if (audio.currentTime > 3) {
      seek(0);
      return;
    }

    const queue = queueRef.current;
    const index = queue.findIndex((track) => track.id === currentTrack.id);
    const previousTrack = index > 0 ? queue[index - 1] : undefined;
    if (previousTrack) await playTrack(previousTrack, { queue });
    else seek(0);
  }, [playTrack, seek]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !trackRef.current) return;
    if (audio.paused || audio.ended) await play();
    else pause();
  }, [pause, play]);

  const clear = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    trackRef.current = null;
    queueRef.current = [];
    pendingRestoreRef.current = false;
    stopAnalyserLoop();
    setState(initialState);
  }, [stopAnalyserLoop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const duration = effectiveDuration(audio, trackRef.current?.duration);
      setState((current) => ({ ...current, duration }));

      if (!pendingRestoreRef.current || !trackRef.current || duration <= 0) return;
      pendingRestoreRef.current = false;

      const saved = readStoredPositions()[trackRef.current.id];
      if (
        saved &&
        saved.url === trackRef.current.url &&
        saved.time > 0 &&
        saved.time < Math.max(0, duration - 2)
      ) {
        try {
          audio.currentTime = saved.time;
          setState((current) => ({ ...current, currentTime: saved.time }));
        } catch {
          // Ignore restore failures; normal playback still works.
        }
      }
    };

    const syncTime = () => {
      const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const duration = effectiveDuration(audio, trackRef.current?.duration);
      setState((current) => ({ ...current, currentTime, duration }));

      const track = trackRef.current;
      const now = Date.now();
      if (
        track &&
        now - lastPositionWriteRef.current >= POSITION_WRITE_INTERVAL_MS &&
        (!duration || currentTime < Math.max(0, duration - 2))
      ) {
        lastPositionWriteRef.current = now;
        writeStoredPosition(track, currentTime);
      }
    };

    const syncBuffered = () => {
      const duration = effectiveDuration(audio, trackRef.current?.duration);
      setState((current) => ({
        ...current,
        duration,
        buffered: duration > 0 ? Math.min(duration, bufferedEnd(audio)) : bufferedEnd(audio),
      }));
    };

    const handleCanPlay = () =>
      setState((current) => ({ ...current, isReady: true, error: null }));
    const handleWaiting = () =>
      setState((current) => ({ ...current, isReady: false }));
    const handlePlay = () => {
      setState((current) => ({ ...current, isPlaying: true, error: null }));
      startAnalyserLoop();
    };
    const handlePause = () => {
      setState((current) => ({ ...current, isPlaying: false, levels: [] }));
      stopAnalyserLoop();
    };
    const handleEnded = () => {
      const track = trackRef.current;
      if (track) writeStoredPosition(track, 0);
      stopAnalyserLoop();
      setState((current) => ({
        ...current,
        isPlaying: false,
        currentTime: current.duration,
        levels: [],
      }));

      const queue = queueRef.current;
      const index = track ? queue.findIndex((candidate) => candidate.id === track.id) : -1;
      const nextTrack = index >= 0 ? queue[index + 1] : undefined;
      if (nextTrack) void playTrackRef.current?.(nextTrack, { queue });
    };
    const handleError = () => {
      stopAnalyserLoop();
      setState((current) => ({
        ...current,
        isPlaying: false,
        isReady: false,
        levels: [],
        error: "پخش فایل صوتی ممکن نشد. اتصال فایل یا پاسخ سرور را بررسی کنید.",
      }));
    };
    const handleEmptied = () =>
      setState((current) => ({
        ...current,
        currentTime: 0,
        buffered: 0,
        isReady: false,
        levels: [],
      }));

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("progress", syncBuffered);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("emptied", handleEmptied);

    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("progress", syncBuffered);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("emptied", handleEmptied);
    };
  }, [startAnalyserLoop, stopAnalyserLoop]);

  useEffect(() => {
    const persistPosition = () => {
      const audio = audioRef.current;
      const track = trackRef.current;
      if (audio && track) writeStoredPosition(track, audio.currentTime || 0);
    };
    window.addEventListener("pagehide", persistPosition);
    return () => window.removeEventListener("pagehide", persistPosition);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const currentTrack = state.currentTrack;
    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: currentTrack.cover ? [{ src: currentTrack.cover }] : undefined,
      });
    } else {
      navigator.mediaSession.metadata = null;
    }

    navigator.mediaSession.playbackState = state.currentTrack
      ? state.isPlaying
        ? "playing"
        : "paused"
      : "none";
  }, [state.currentTrack, state.isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ["play", () => void play()],
      ["pause", pause],
      ["previoustrack", () => void previous()],
      ["nexttrack", () => void next()],
      ["seekbackward", (details) => seekBy(-(details.seekOffset ?? 10))],
      ["seekforward", (details) => seekBy(details.seekOffset ?? 10)],
      ["seekto", (details) => {
        if (typeof details.seekTime === "number") seek(details.seekTime);
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Older browsers expose Media Session but not every action.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported actions.
        }
      }
    };
  }, [next, pause, play, previous, seek, seekBy]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      stopAnalyserLoop();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      const context = audioContextRef.current;
      if (context && context.state !== "closed") void context.close();
    };
  }, [stopAnalyserLoop]);

  const currentIndex = state.currentTrack
    ? state.queue.findIndex((track) => track.id === state.currentTrack?.id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < state.queue.length - 1;

  const value = useMemo<AudioContextValue>(
    () => ({
      ...state,
      hasNext,
      hasPrevious,
      playTrack,
      play,
      pause,
      toggle,
      seek,
      seekBy,
      next,
      previous,
      setQueue,
      clear,
    }),
    [
      state,
      hasNext,
      hasPrevious,
      playTrack,
      play,
      pause,
      toggle,
      seek,
      seekBy,
      next,
      previous,
      setQueue,
      clear,
    ],
  );

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" playsInline className="hidden" />
    </GlobalAudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(GlobalAudioContext);
  if (!context) throw new Error("useAudio must be used inside AudioProvider");
  return context;
}
