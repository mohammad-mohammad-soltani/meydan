"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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

/** X shows at most four tiles; the rest are summarised on the last one. */
const MAX_TILES = 4;

const TILE_LAYOUTS: Record<number, { grid: string; container: string; tiles: string[] }> = {
  2: { grid: "grid-cols-2 grid-rows-1", container: "aspect-[16/9]", tiles: ["", ""] },
  3: { grid: "grid-cols-3 grid-rows-2", container: "aspect-[16/10]", tiles: ["col-span-2 row-span-2", "", ""] },
  4: { grid: "grid-cols-2 grid-rows-2", container: "aspect-[16/11]", tiles: ["", "", "", ""] },
};

type MediaGalleryProps = {
  items: MediaItem[];
  /** Namespace for audio track ids, e.g. `post:12` or `chat:9`. */
  scope: string;
  /** Shown in the bottom player while an audio attachment is playing. */
  artist?: string;
  cover?: string;
  className?: string;
  /** `bubble` matches chat bubbles; `surface` matches feed/post/content cards. */
  tone?: "surface" | "bubble";
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
  scope,
  artist,
  cover,
  className = "",
  tone = "surface",
}: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visuals = useMemo(() => visualItems(items), [items]);
  const audios = useMemo(() => audioItems(items), [items]);
  const files = useMemo(() => fileItems(items), [items]);

  const single = visuals.length === 1 ? visuals[0] : null;
  const shown = visuals.slice(0, MAX_TILES);
  const hiddenCount = visuals.length - shown.length;
  const layout = TILE_LAYOUTS[Math.min(visuals.length, MAX_TILES)];
  const isBubble = tone === "bubble";
  const frameRadius = isBubble ? "rounded-xl" : "rounded-2xl";
  const tileRadius = isBubble ? "rounded-lg" : "rounded-none";

  return (
    <div
      className={className}
      data-media-interactive
      onClick={(event) => event.stopPropagation()}
    >
      {single ? (
        single.kind === "video" ? (
          <VideoPlayer item={single} variant="inline" />
        ) : (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            aria-label={`نمایش ${single.title}`}
            className={`group/media relative block w-full overflow-hidden border border-border bg-surface-sunken ${frameRadius}`}
          >
            <span
              className={`relative block w-full ${isBubble ? "max-h-[26rem]" : ""}`}
              style={{ aspectRatio: mediaAspectRatio(single.width, single.height) }}
            >
              <Image
                src={single.src as string}
                alt={single.title}
                fill
                quality={MEDIA_THUMB_QUALITY}
                sizes="(max-width: 640px) calc(100vw - 72px), 520px"
                className="object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
                draggable={false}
              />
            </span>
          </button>
        )
      ) : visuals.length > 1 && layout ? (
        <div className={`ui-enter grid gap-1 overflow-hidden ${frameRadius} ${layout.grid} ${layout.container}`}>
          {shown.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              aria-label={`نمایش ${item.title}`}
              className={`group/tile relative min-h-0 overflow-hidden bg-surface-sunken ${layout.tiles[index] ?? ""} ${tileRadius}`}
            >
              {item.kind === "video" ? (
                <>
                  <video
                    src={item.src}
                    poster={item.poster}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full bg-black object-cover"
                  />
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
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
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  );
}
