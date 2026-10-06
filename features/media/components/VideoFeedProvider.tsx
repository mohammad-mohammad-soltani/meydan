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
import { ReelsView } from "./ReelsView";
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
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

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
    // One entry per viewer, never one per open: a second push would cost the
    // page behind an extra back press that appears to do nothing.
    if (!currentState[VIDEO_FEED_HISTORY_KEY]) {
      history.pushState({ ...currentState, [VIDEO_FEED_HISTORY_KEY]: true }, "");
    }
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
  // A link inside the viewer navigates without going through `close`, which
  // would carry the marker onto the next page and leave `close` believing an
  // entry of ours is still on the stack.
  useEffect(() => {
    if (session) return;
    // `open` claimed the feed for the viewer; give it back so timeline players
    // can start (and open the reels) again once the viewer is closed.
    setVideoFeedOwner(false);
    const state = history.state;
    if (state && typeof state === "object" && state[VIDEO_FEED_HISTORY_KEY]) {
      history.replaceState({ ...state, [VIDEO_FEED_HISTORY_KEY]: false }, "");
    }
  }, [session]);

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
        session.entry.item.kind === "video" ? (
          // A tapped video opens the reels on it; scrolling on continues with the video narratives.
          <ReelsView key={session.entry.key} initial={session.queue} onClose={close} />
        ) : (
          // Photos keep the full-screen media viewer (zoom, swipe between a post's attachments).
          <VideoFeedViewer key={session.entry.key} session={session} onClose={close} />
        )
      )}
    </VideoFeedContext.Provider>
  );
}
