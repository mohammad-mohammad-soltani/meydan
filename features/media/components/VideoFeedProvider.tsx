"use client";

import {
  createContext,
  useCallback,
  useContext,
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
const VideoFeedContext = createContext<
  ((request: VideoFeedRequest) => void) | null
>(null);
export const useVideoFeed = () => useContext(VideoFeedContext);

export function VideoFeedProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const open = useCallback((request: VideoFeedRequest) => {
    stopVideoAutoplay();
    setVideoFeedOwner(true);
    for (const video of document.querySelectorAll("video")) video.pause();
    if (document.pictureInPictureElement)
      void document.exitPictureInPicture().catch(() => {});
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
  const close = useCallback(() => setSession(null), []);
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
