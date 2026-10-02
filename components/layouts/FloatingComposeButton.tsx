"use client";

import Link from "next/link";
import { useState } from "react";
import { Clapperboard, LoaderCircle, PenLine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAudio } from "@/features/audio/AudioProvider";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { getFeedPage } from "@/features/feed/services/feed.service";
import { useVideoFeed } from "@/features/media/components/VideoFeedProvider";
import { scanVideoPages, videoFeedQuery, type VideoPageState } from "@/features/media/video-feed-queue";

/**
 * Mobile-only floating actions: compose (primary, compact) with a smaller «video feed» shortcut stacked
 * above it. From `lg` up the desktop sidebar owns compose (`SidebarComposeButton`), so both hide there.
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
      className={`absolute left-3 z-40 flex flex-col items-center gap-2.5 lg:hidden transition-[bottom] duration-300 ease-out ${
        currentTrack ? "bottom-[calc(11rem+env(safe-area-inset-bottom))]" : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <button
        type="button"
        onClick={() => void openVideos()}
        disabled={loadingVideos}
        aria-label={videoError ? "ویدیویی پیدا نشد؛ دوباره تلاش کنید" : "مشاهده ویدیوها"}
        title={videoError ? "ویدیویی پیدا نشد" : "فید ویدیو"}
        className={`group relative grid size-10 place-items-center rounded-full border border-white/15 text-on-solid shadow-floating transition-[transform,filter] duration-200 hover:scale-105 hover:brightness-110 active:scale-90 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait ${
          videoError ? "bg-warning" : "bg-info"
        }`}
      >
        {loadingVideos ? (
          <LoaderCircle aria-hidden="true" className="h-[1.15rem] w-[1.15rem] animate-spin motion-reduce:animate-none" />
        ) : (
          <Clapperboard aria-hidden="true" className="h-[1.15rem] w-[1.15rem] transition-transform duration-200 group-hover:scale-110" strokeWidth={2.2} />
        )}
      </button>

      <Link
        href="/compose"
        onClick={(event) => {
          if (!requireAuth("/compose")) event.preventDefault();
        }}
        aria-label="نوشتن روایت تازه"
        title="نوشتن روایت"
        className="group relative grid size-12 place-items-center overflow-visible rounded-full border border-brand/20 bg-brand text-brand-foreground shadow-floating transition-[transform,box-shadow,filter] duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-dialog hover:brightness-105 active:translate-y-0 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-4"
      >
        <span aria-hidden="true" className="pointer-events-none absolute -inset-1 -z-10 rounded-full bg-brand/20 opacity-60 blur-md transition-all duration-300 group-hover:-inset-1.5 group-hover:opacity-80" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-[2px] rounded-full border border-white/10" />
        <PenLine aria-hidden="true" className="relative z-10 h-[1.2rem] w-[1.2rem] transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 group-active:rotate-0 group-active:scale-95" strokeWidth={2.35} />
      </Link>
    </div>
  );
}
