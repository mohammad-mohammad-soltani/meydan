"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { AudioState, AudioTrack } from "./types";

const initialState: AudioState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
};

type AudioContextType = AudioState & {
  playTrack: (track: AudioTrack) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>(initialState);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const update = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime || 0 }));
    const duration = () =>
      setState((s) => ({ ...s, duration: Number.isFinite(audio.duration) ? audio.duration : 0 }));

    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", duration);
    audio.addEventListener("durationchange", duration);
    audio.addEventListener("ended", () => setState((s) => ({ ...s, isPlaying: false })));

    return () => {
      audio.pause();
      audio.remove();
    };
  }, []);

  const playTrack = (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.currentTrack?.id !== track.id) {
      audio.src = track.url;
      audio.currentTime = 0;
      setState((s) => ({ ...s, currentTrack: track }));
    }

    audio.play();
    setState((s) => ({ ...s, isPlaying: true }));
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setState((s) => ({ ...s, isPlaying: true }));
    } else {
      audio.pause();
      setState((s) => ({ ...s, isPlaying: false }));
    }
  };

  const pause = () => audioRef.current?.pause();
  const seek = (seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds;
  };

  return (
    <AudioContext.Provider value={{ ...state, playTrack, toggle, pause, seek }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be inside AudioProvider");
  return ctx;
}
