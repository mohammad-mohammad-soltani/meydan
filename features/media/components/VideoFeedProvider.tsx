"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { VideoFeedEntry } from "../video-feed-queue";
import { appendVideos } from "../video-feed-queue";
import { setVideoFeedOwner, stopVideoAutoplay } from "@/lib/video-sound";
import { VideoFeedViewer } from "./VideoFeedViewer";

export type VideoFeedRequest = {
  entry: VideoFeedEntry;
  candidates: VideoFeedEntry[];
  source?: HTMLVideoElement;
  returnFocus?: HTMLElement | null;
};
type Session = VideoFeedRequest & {
  queue: VideoFeedEntry[];
  startTime: number;
  focus: HTMLElement | null;
};
const VIDEO_FEED_HISTORY_KEY = "__meydan_video_feed";

const VideoFeedContext = createContext<
  ((request: VideoFeedRequest) => void) | null
>(null);
export const useVideoFeed = () => useContext(VideoFeedContext);

export function VideoFeedProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  useEffect(() => {
    const closeFromHistory = () => {
      if (sessionRef.current) setSession(null);
    };
    window.addEventListener("popstate", closeFromHistory);
    return () => window.removeEventListener("popstate", closeFromHistory);
  }, []);

  const open = useCallback((request: VideoFeedRequest) => {
    stopVideoAutoplay();
    setVideoFeedOwner(true);
    for (const video of document.querySelectorAll("video")) video.pause();
    if (document.pictureInPictureElement)
      void document.exitPictureInPicture().catch(() => {});
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    history.pushState({ ...currentState, [VIDEO_FEED_HISTORY_KEY]: true }, "");
    setSession({
      ...request,
      queue: appendVideos([request.entry], request.candidates),
      startTime: request.source?.ended ? 0 : request.source?.currentTime || 0,
      focus:
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
    });
  }, []);
  const close = useCallback(() => {
    if (history.state?.[VIDEO_FEED_HISTORY_KEY]) {
      history.back();
      return;
    }
    setSession(null);
  }, []);
  return (
    <VideoFeedContext.Provider value={open}>
      {children}
      {session && (
        <VideoFeedViewer
          key={session.entry.key}
          session={session}
          onClose={close}
        />
      )}
    </VideoFeedContext.Provider>
  );
}
