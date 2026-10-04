"use client";

import { analysisPaused, attachAnalyser, peekCors, probeCors } from "./audio-analysis";
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
import { POSITION_WRITE_INTERVAL_MS, bufferedEnd, effectiveDuration, nativeAudioBridgeAvailable, postNativeAudio, readStoredPositions, writeStoredPosition, type NativeAudioStateDetail } from "./audio-runtime";

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

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<AudioTrack | null>(null);
  const queueRef = useRef<AudioTrack[]>([]);
  const playTrackRef = useRef<
    ((track: AudioTrack, options?: PlayTrackOptions) => Promise<void>) | null
  >(null);
  const pendingRestoreRef = useRef(false);
  const lastPositionWriteRef = useRef(0);
  const nativePlaybackRef = useRef(false);
  const nativePlayingRef = useRef(false);
  const nativeFinishHandledRef = useRef<string | null>(null);
  const [state, setState] = useState<AudioState>(initialState);
  const stateRef = useRef<AudioState>(initialState);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const play = useCallback(async () => {
    if (!trackRef.current) return;

    setState((current) => ({ ...current, error: null }));

    if (
      nativePlaybackRef.current &&
      postNativeAudio({ type: "native-audio-play" })
    ) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();

    } catch {
      setState((current) => ({
        ...current,
        isPlaying: false,
        error: "مرورگر نتوانست پخش صوت را شروع کند. دوباره تلاش کنید.",
      }));
    }
  }, []);

  const pause = useCallback(() => {
    if (
      nativePlaybackRef.current &&
      postNativeAudio({ type: "native-audio-pause" })
    ) {
      return;
    }
    audioRef.current?.pause();
  }, []);

  const setQueue = useCallback((queue: AudioTrack[]) => {
    queueRef.current = queue;
    setState((current) => ({ ...current, queue }));
  }, []);

  const playTrack = useCallback(
    async (track: AudioTrack, options: PlayTrackOptions = {}) => {
      if (!track.url) return;

      const audio = audioRef.current;
      const isDifferentTrack =
        trackRef.current?.id !== track.id || trackRef.current?.url !== track.url;

      if (options.queue) {
        queueRef.current = options.queue;
      } else if (!queueRef.current.some((candidate) => candidate.id === track.id)) {
        queueRef.current = [track];
      }

      const useNativeAudio = nativeAudioBridgeAvailable();

      if (useNativeAudio) {
        nativePlaybackRef.current = true;
        nativeFinishHandledRef.current = null;

        if (isDifferentTrack) {
          audio?.pause();
          trackRef.current = track;
          pendingRestoreRef.current = false;
          lastPositionWriteRef.current = 0;
          nativePlayingRef.current = false;

          const saved = options.restart
            ? undefined
            : readStoredPositions()[track.id];
          const resumePosition =
            saved && saved.url === track.url && saved.time > 0 ? saved.time : 0;

          setState((current) => ({
            ...current,
            currentTrack: track,
            currentTime: resumePosition,
            duration: track.duration ?? 0,
            buffered: 0,
            isReady: false,
            isPlaying: false,
            error: null,
            levels: [],
            queue: queueRef.current,
          }));

          const loaded = postNativeAudio({
            type: "native-audio-load",
            track: {
              id: track.id,
              title: track.title,
              artist: track.artist,
              url: track.url,
              cover: track.cover,
              sourceHref: track.sourceHref,
            },
            position: resumePosition,
            autoplay: options.autoplay !== false,
          });

          if (loaded) return;
          nativePlaybackRef.current = false;
        } else {
          setState((current) => ({
            ...current,
            currentTrack: track,
            queue: queueRef.current,
            error: null,
          }));

          if (options.restart) {
            postNativeAudio({ type: "native-audio-seek", seconds: 0 });
            setState((current) => ({ ...current, currentTime: 0 }));
          }
          if (options.autoplay !== false) {
            postNativeAudio({ type: "native-audio-play" });
          }
          return;
        }
      }

      if (!audio) return;
      nativePlaybackRef.current = false;
      nativePlayingRef.current = false;

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

        // Spectrum data needs the host's CORS answer; without a "yes" the element is loaded exactly as before.
        const cors = peekCors(track.url);
        if (cors === undefined) void probeCors(track.url);
        if (cors) audio.crossOrigin = "anonymous";
        else if (!audio.crossOrigin) audio.removeAttribute("crossorigin");
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

  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

  const seek = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return;

    if (nativePlaybackRef.current) {
      const duration = stateRef.current.duration;
      const nextTime = Math.max(
        0,
        duration > 0 ? Math.min(duration, seconds) : seconds,
      );
      if (postNativeAudio({ type: "native-audio-seek", seconds: nextTime })) {
        setState((current) => ({ ...current, currentTime: nextTime }));
        return;
      }
    }

    const audio = audioRef.current;
    if (!audio) return;

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
      if (nativePlaybackRef.current) {
        seek(stateRef.current.currentTime + seconds);
        return;
      }
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
    const currentTrack = trackRef.current;
    if (!currentTrack) return;

    const currentTime = nativePlaybackRef.current
      ? stateRef.current.currentTime
      : (audioRef.current?.currentTime ?? 0);

    if (currentTime > 3) {
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
    if (!trackRef.current) return;
    if (nativePlaybackRef.current) {
      if (stateRef.current.isPlaying) pause();
      else await play();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) await play();
    else pause();
  }, [pause, play]);

  const clear = useCallback(() => {
    if (nativePlaybackRef.current) {
      postNativeAudio({ type: "native-audio-clear" });
    }

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    trackRef.current = null;
    queueRef.current = [];
    pendingRestoreRef.current = false;
    nativePlaybackRef.current = false;
    nativePlayingRef.current = false;
    nativeFinishHandledRef.current = null;

    setState(initialState);
  }, []);

  useEffect(() => {
    const handleNativeAudioState = (event: Event) => {
      const detail = (event as CustomEvent<NativeAudioStateDetail>).detail;
      const track = trackRef.current;
      if (!detail || !track || detail.trackId !== track.id) return;

      const currentTime =
        typeof detail.currentTime === "number" && Number.isFinite(detail.currentTime)
          ? Math.max(0, detail.currentTime)
          : stateRef.current.currentTime;
      const duration =
        typeof detail.duration === "number" && Number.isFinite(detail.duration)
          ? Math.max(0, detail.duration)
          : stateRef.current.duration;
      const isPlaying = detail.isPlaying === true;
      const isReady = detail.isReady === true;
      const didJustFinish = detail.didJustFinish === true;

      nativePlaybackRef.current = true;
      nativePlayingRef.current = isPlaying;

      setState((current) => ({
        ...current,
        isPlaying,
        isReady,
        currentTime,
        duration,
        buffered: isReady ? Math.max(current.buffered, duration) : current.buffered,
        error:
          typeof detail.error === "string" && detail.error
            ? "پخش صوت در اپ با خطا روبه‌رو شد. دوباره تلاش کنید."
            : null,
        levels: [],
      }));

      const now = Date.now();
      if (
        !didJustFinish &&
        now - lastPositionWriteRef.current >= POSITION_WRITE_INTERVAL_MS
      ) {
        lastPositionWriteRef.current = now;
        writeStoredPosition(track, currentTime);
      }


      if (
        didJustFinish &&
        nativeFinishHandledRef.current !== track.id
      ) {
        nativeFinishHandledRef.current = track.id;
        writeStoredPosition(track, 0);

        const queue = queueRef.current;
        const index = queue.findIndex((candidate) => candidate.id === track.id);
        const nextTrack = index >= 0 ? queue[index + 1] : undefined;
        if (nextTrack) {
          void playTrackRef.current?.(nextTrack, { queue });
        }
      } else if (!didJustFinish) {
        nativeFinishHandledRef.current = null;
      }
    };

    window.addEventListener(
      "naghshman:native-audio-state",
      handleNativeAudioState as EventListener,
    );
    return () =>
      window.removeEventListener(
        "naghshman:native-audio-state",
        handleNativeAudioState as EventListener,
      );
  }, []);

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

    const handleCanPlay = () => {
      setState((current) => ({ ...current, isReady: true, error: null }));
      attachAnalyser(audio);
    };
    const handleWaiting = () =>
      setState((current) => ({ ...current, isReady: false }));
    const handlePlay = () => {
      setState((current) => ({ ...current, isPlaying: true, error: null }));
      attachAnalyser(audio);
    };
    const handlePause = () => {
      setState((current) => ({ ...current, isPlaying: false, levels: [] }));
      analysisPaused();
    };
    const handleEnded = () => {
      analysisPaused();
      const track = trackRef.current;
      if (track) writeStoredPosition(track, 0);

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
      analysisPaused();
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
  }, []);

  useEffect(() => {
    const persistPosition = () => {
      const track = trackRef.current;
      if (!track) return;

      if (nativePlaybackRef.current) {
        writeStoredPosition(track, stateRef.current.currentTime);
        return;
      }

      const audio = audioRef.current;
      if (audio) writeStoredPosition(track, audio.currentTime || 0);
    };
    window.addEventListener("pagehide", persistPosition);
    return () => window.removeEventListener("pagehide", persistPosition);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (nativeAudioBridgeAvailable()) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

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
    if (nativeAudioBridgeAvailable()) return;

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
    const audio = audioRef.current;
    return () => {
      audio?.pause();

    };
  }, []);

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
