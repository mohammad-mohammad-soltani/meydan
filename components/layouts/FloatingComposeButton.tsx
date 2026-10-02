"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Plus, SquarePlay } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudio } from "@/features/audio/AudioProvider";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { useVideoFeed } from "@/features/media/components/VideoFeedProvider";
import { scanVideoPages, videoFeedQuery, type VideoPageState } from "@/features/media/video-feed-queue";

/**
 * Floating actions: compose (primary) with a smaller «video feed» shortcut stacked above it. On
 * desktop they are pinned to the viewport's bottom-left corner, as in the reference design.
 */
export function FloatingComposeButton() {
  const pathname = usePathname();
  const { currentTrack } = useAudio();
  const { requireAuth } = useAuthGate();
  const openVideoFeed = useVideoFeed();
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const isVisible = pathname === "/home" || pathname === "/profile";

  if (!isVisible) return null;

  async function openVideos() {
    if (loadingVideos || !openVideoFeed) return;
    setLoadingVideos(true);
    setVideoError(false);
    try {
      const state: VideoPageState = { cursor: null, exhausted: false, recovered: false };
      const { queue } = await scanVideoPages(state, [], (cursor) => getFeedPage(videoFeedQuery(cursor)));
      if (!queue.length) {
        setVideoError(true);
        return;
      }
      openVideoFeed({ entry: queue[0], candidates: queue.slice(1) });
    } catch {
      setVideoError(true);
    } finally {
      setLoadingVideos(false);
    }
  }

  return (
    <div
      className={`absolute left-4 z-40 flex flex-col items-center gap-4 lg:fixed lg:!bottom-20 transition-[bottom] duration-300 ease-out ${
        currentTrack ? "bottom-[calc(11rem+env(safe-area-inset-bottom))]" : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <button
        type="button"
        onClick={() => void openVideos()}
        disabled={loadingVideos}
        aria-label={videoError ? "ویدیویی پیدا نشد؛ دوباره تلاش کنید" : "مشاهده ویدیوها"}
        title={videoError ? "ویدیویی پیدا نشد" : "فید ویدیو"}
        className={`group relative grid size-10 place-items-center rounded-full border shadow-floating transition-[transform,filter] duration-200 hover:scale-105 active:scale-90 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait ${
          videoError ? "border-warning bg-warning-surface text-warning" : "border-border-strong bg-surface-muted text-foreground"
        }`}
      >
        {loadingVideos ? (
          <LoaderCircle aria-hidden="true" className="h-[1.15rem] w-[1.15rem] animate-spin motion-reduce:animate-none" />
        ) : (
          <SquarePlay aria-hidden="true" className="h-[1.15rem] w-[1.15rem] transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
        )}
      </button>

      <Link
        href="/compose"
        onClick={(event) => {
          if (!requireAuth("/compose")) event.preventDefault();
        }}
        aria-label="نوشتن روایت تازه"
        title="نوشتن روایت"
        className="group relative grid size-14 place-items-center overflow-visible rounded-full bg-brand text-brand-foreground shadow-floating transition-[transform,box-shadow,filter] duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-dialog hover:brightness-105 active:translate-y-0 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-4"
      >
        <Plus aria-hidden="true" className="relative z-10 h-7 w-7 transition-transform duration-300 ease-out group-hover:rotate-90" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
