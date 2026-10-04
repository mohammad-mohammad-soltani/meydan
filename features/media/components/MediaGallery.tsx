"use client";

import styles from "../reference.module.css";

import type { FeedPost } from "@/features/feed/types";
import { useVideoFeed } from "./VideoFeedProvider";
import { videosFromPosts } from "../video-feed-queue";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { MediaItem } from "../types";
import {
  audioItems,
  faDigits,
  fileItems,
  mediaAspectRatio,
  MEDIA_THUMB_QUALITY,
  visualItems,
} from "../media-utils";
import { MediaAudioCard } from "./MediaAudioCard";
import { MediaFileCard } from "./MediaFileCard";
import { MediaLightbox } from "./MediaLightbox";
import { VideoPlayer } from "./VideoPlayer";
import { VideoPreview } from "./VideoPreview";

/** X shows at most four tiles; the rest are summarised on the last one. */
const MAX_TILES = 4;

const TILE_LAYOUTS: Record<number, { grid: string; container: string; tiles: string[] }> = {
  2: { grid: "grid-cols-2 grid-rows-1", container: "aspect-[16/9]", tiles: ["", ""] },
  3: { grid: "grid-cols-3 grid-rows-2", container: "aspect-[16/10]", tiles: ["col-span-2 row-span-2", "", ""] },
  4: { grid: "grid-cols-2 grid-rows-2", container: "aspect-[16/11]", tiles: ["", "", "", ""] },
};

type MediaGalleryProps = {
  items: MediaItem[];
  videoPost?: FeedPost;
  videoPosts?: FeedPost[];
  /** Namespace for audio track ids, e.g. `post:12` or `chat:9`. */
  scope: string;
  /** Shown in the bottom player while an audio attachment is playing. */
  artist?: string;
  cover?: string;
  className?: string;
  /** `bubble` matches chat bubbles; `surface` matches feed/post/content cards. */
  tone?: "surface" | "bubble";
  /** Only timeline previews use the reference’s fixed image/video frame. */
  presentation?: "timeline";
};

/**
 * The one attachment gallery: a single image/video keeps the full width,
 * several are laid out in an X-style mosaic, audio plays through the shared
 * bottom player, files fall back to a row, and every visual opens the shared
 * zoomable lightbox. Feed posts, post pages, content and chat all use this.
 *
 * Photos here are served as optimized thumbnails (small width, low quality) so
 * a timeline paints fast; the lightbox is what fetches the original file.
 */
export function MediaGallery({
  items,
  videoPost,
  videoPosts,
  scope,
  artist,
  cover,
  className = "",
  tone = "surface",
  presentation,
}: MediaGalleryProps) {
  const openVideoFeed = useVideoFeed();
  const galleryRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Chat attachments created before intrinsic width/height metadata existed do
  // not know their ratio up front. Learn it from the decoded image so an old
  // square photo still renders in a square frame instead of a guessed 4:3 box.
  const [naturalRatios, setNaturalRatios] = useState<Record<string, number>>({});

  const visuals = useMemo(() => visualItems(items), [items]);
  const audios = useMemo(() => audioItems(items), [items]);
  const files = useMemo(() => fileItems(items), [items]);

  const single = visuals.length === 1 ? visuals[0] : null;
  const shown = visuals.slice(0, MAX_TILES);
  const hiddenCount = visuals.length - shown.length;
  const layout = TILE_LAYOUTS[Math.min(visuals.length, MAX_TILES)];
  const pairedVideos = shown.length === 2 && shown.every((item) => item.kind === "video");
  const pairRatio = pairedVideos ? shown.reduce((sum, item) => {
    const ratio = item.width && item.height ? item.width / item.height : naturalRatios[item.id] ?? 9 / 16;
    return sum + Math.min(16 / 9, Math.max(9 / 16, ratio));
  }, 0) : undefined;
  const isBubble = tone === "bubble";
  const frameRadius = isBubble ? "rounded-xl" : "rounded-2xl";
  const tileRadius = isBubble ? "rounded-lg" : "rounded-none";
  const singleRatio = single
    ? single.width && single.height
      ? mediaAspectRatio(single.width, single.height)
      : naturalRatios[single.id] ?? (isBubble ? 1 : 16 / 9)
    : 16 / 9;

  const canOpenFeed = Boolean(videoPost && openVideoFeed);
  const openFeed = (item: MediaItem, source?: HTMLVideoElement) => {
    if (!videoPost || !openVideoFeed) return;
    const videos = videosFromPosts([videoPost]);
    const base = videos.find((entry) => entry.item.id === item.id) ?? videos[0] ?? {
      post: videoPost, postId: videoPost.id, author: videoPost.squareName,
      authorKey: `${videoPost.author.type}:${videoPost.author.id}`, body: videoPost.body, media: visuals,
    };
    const entry = base ? { ...base, item, key: `${videoPost.id}:${item.id}` } : undefined;
    if (!entry) return;
    setLightboxIndex(null);
    openVideoFeed({ entry, candidates: videosFromPosts(videoPosts ?? [videoPost]), source, returnFocus: galleryRef.current });
  };

  return (
    <div
      ref={galleryRef}
      tabIndex={-1}
      className={`${className} ${presentation === "timeline" ? styles.timelineGallery : ""}`}
      data-media-interactive
      onClick={(event) => event.stopPropagation()}
    >
      {single ? (
        single.kind === "video" ? (
          // `preload="none"`: an upload can be tens of megabytes and is not
          // web-optimized, so a card must not fetch anything until play.
          <VideoPlayer
            item={single}
            onRequestPlay={canOpenFeed ? (video) => {
              if (
                typeof window === "undefined" ||
                !window.matchMedia("(max-width: 767px)").matches
              ) {
                return false;
              }
              openFeed(single, video);
              return true;
            } : undefined}
            onRequestFullscreen={canOpenFeed ? (video) => openFeed(single, video) : undefined}
            variant="inline"
            preload="none"
            hideIdleControlsOnMobile
          />
        ) : (
          <button
            type="button"
            onClick={() => canOpenFeed ? openFeed(single) : setLightboxIndex(0)}
            aria-label={`نمایش ${single.title}`}
            className={`group/media relative block w-full overflow-hidden border border-border bg-surface-sunken ${frameRadius}`}
          >
            <span
              className={`relative block w-full ${isBubble ? "max-h-[26rem] bg-black/[0.03]" : ""}`}
              style={{ aspectRatio: singleRatio }}
            >
              <Image
                src={single.src as string}
                alt={single.title}
                fill
                quality={MEDIA_THUMB_QUALITY}
                sizes="(max-width: 640px) calc(100vw - 72px), 520px"
                className={`${isBubble ? "object-contain" : "object-cover"} transition-transform duration-300 group-hover/media:scale-[1.01]`}
                draggable={false}
                onLoad={(event) => {
                  if (!isBubble || single.width || single.height) return;
                  const width = event.currentTarget.naturalWidth;
                  const height = event.currentTarget.naturalHeight;
                  if (!width || !height) return;
                  const ratio = mediaAspectRatio(width, height, 1);
                  setNaturalRatios((current) =>
                    current[single.id] === ratio
                      ? current
                      : { ...current, [single.id]: ratio },
                  );
                }}
              />
            </span>
          </button>
        )
      ) : visuals.length > 1 && layout ? (
        <div className={`ui-enter grid gap-1 overflow-hidden ${frameRadius} ${layout.grid} ${pairedVideos ? "" : layout.container}`} style={pairRatio ? { aspectRatio: pairRatio } : undefined}>
          {shown.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => canOpenFeed ? openFeed(item) : setLightboxIndex(index)}
              aria-label={`نمایش ${item.title}`}
              className={`group/tile relative min-h-0 overflow-hidden bg-surface-sunken ${layout.tiles[index] ?? ""} ${tileRadius}`}
            >
              {item.kind === "video" ? (
                <>
                  <VideoPreview key={item.src} item={item} onRatio={(ratio) => {
                    setNaturalRatios((current) => current[item.id] === ratio ? current : { ...current, [item.id]: ratio });
                  }} />
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition-transform group-hover/tile:scale-110">
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    </span>
                  </span>
                </>
              ) : (
                <Image
                  src={item.src as string}
                  alt={item.title}
                  fill
                  quality={MEDIA_THUMB_QUALITY}
                  sizes="(max-width: 640px) 50vw, 260px"
                  className="object-cover transition-transform duration-300 group-hover/tile:scale-[1.02]"
                  draggable={false}
                />
              )}

              {hiddenCount > 0 && index === shown.length - 1 ? (
                <span className="absolute inset-0 grid place-items-center bg-black/55 text-lg font-black text-white backdrop-blur-[1px]">
                  +{faDigits(String(hiddenCount))}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {audios.map((item) => (
        <MediaAudioCard
          key={item.id}
          item={item}
          scope={scope}
          artist={artist}
          cover={cover}
          tone={tone}
        />
      ))}

      {files.map((item) => (
        <MediaFileCard key={item.id} item={item} tone={tone} />
      ))}

      {lightboxIndex !== null ? (
        <MediaLightbox
          items={visuals}
          onOpenVideoFeed={canOpenFeed ? openFeed : undefined}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  );
}
