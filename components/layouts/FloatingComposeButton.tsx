"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./shell.module.css";
import { LoaderCircle, Plus } from "lucide-react";
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

  const isVisible = pathname === "/home" || pathname === "/profile" || pathname === "/content" || pathname === "/map";

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
      className={`${!currentTrack ? styles.floating : ""} absolute left-4 z-40 flex flex-col items-center gap-2.5 lg:hidden transition-[bottom] duration-300 ease-out ${
        currentTrack ? "bottom-[calc(11rem+env(safe-area-inset-bottom))]" : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <button
        type="button"
        onClick={() => void openVideos()}
        disabled={loadingVideos}
        aria-label={videoError ? "ویدیویی پیدا نشد؛ دوباره تلاش کنید" : "مشاهده ویدیوها"}
        title={videoError ? "ویدیویی پیدا نشد" : "فید ویدیو"}
        className={`group relative grid size-10 place-items-center rounded-full text-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,.5)] transition-transform duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait ${
          videoError ? "bg-warning-surface text-warning" : "border border-border bg-surface-muted"
        }`}
      >
        {/* The reference's glyph while idle: a rounded screen with a filled play triangle. */}
        {loadingVideos ? (
          <LoaderCircle aria-hidden="true" className="h-[1.15rem] w-[1.15rem] animate-spin motion-reduce:animate-none" />
        ) : (
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="4" />
            <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <Link
        href="/compose"
        onClick={(event) => {
          if (!requireAuth("/compose")) event.preventDefault();
        }}
        aria-label="نوشتن روایت تازه"
        title="نوشتن روایت"
        className="group relative grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-[0_14px_30px_-10px_rgba(225,29,72,.65)] transition-[transform,background-color] duration-200 hover:bg-brand-hover active:scale-[0.94] focus-visible:outline-none focus-visible:ring-4"
      >
        <Plus aria-hidden="true" className="h-7 w-7" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
