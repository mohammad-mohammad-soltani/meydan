"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FileText, Play } from "lucide-react";
import type { FeedAttachment } from "../../types";
import { InlineVideoPlayer } from "./InlineVideoPlayer";
import { MediaLightbox } from "./MediaLightbox";
import { PostAudioAttachment } from "./PostAudioAttachment";
import { faDigits, isAudioAttachment, isVisualAttachment, mediaAspectRatio } from "./media-utils";

/** X shows at most four tiles; the rest are summarised on the last one. */
const MAX_TILES = 4;

const TILE_LAYOUTS: Record<number, { grid: string; container: string; tiles: string[] }> = {
  2: { grid: "grid-cols-2 grid-rows-1", container: "aspect-[16/9]", tiles: ["", ""] },
  3: { grid: "grid-cols-3 grid-rows-2", container: "aspect-[16/10]", tiles: ["col-span-2 row-span-2", "", ""] },
  4: { grid: "grid-cols-2 grid-rows-2", container: "aspect-[16/11]", tiles: ["", "", "", ""] },
};

/**
 * Gallery for a post's attachments: a single image/video keeps the full width,
 * several are laid out in an X-style mosaic, audio plays through the shared
 * bottom player and anything else falls back to a file row.
 */
export function PostMediaGallery({
  attachments,
  artist,
  cover,
  className = "",
}: {
  attachments: FeedAttachment[];
  /** Shown in the bottom player while an audio attachment is playing. */
  artist?: string;
  cover?: string;
  className?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visuals = useMemo(() => attachments.filter(isVisualAttachment), [attachments]);
  const audios = useMemo(() => attachments.filter(isAudioAttachment), [attachments]);
  const documents = useMemo(
    () => attachments.filter((item) => !isVisualAttachment(item) && !isAudioAttachment(item)),
    [attachments],
  );

  const single = visuals.length === 1 ? visuals[0] : null;
  const shown = visuals.slice(0, MAX_TILES);
  const hiddenCount = visuals.length - shown.length;
  const layout = TILE_LAYOUTS[Math.min(visuals.length, MAX_TILES)];

  return (
    <div className={className} data-media-interactive onClick={(event) => event.stopPropagation()}>
      {single ? (
        single.icon === "video" ? (
          <InlineVideoPlayer attachment={single} />
        ) : (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            aria-label={`نمایش ${single.previewAlt ?? single.label}`}
            style={{ aspectRatio: mediaAspectRatio(single.width, single.height) }}
            className="group/media relative block w-full overflow-hidden rounded-2xl border border-border bg-surface-sunken"
          >
            <Image
              src={single.previewSrc as string}
              alt={single.previewAlt ?? single.label}
              fill
              unoptimized={(single.previewSrc as string).startsWith("http")}
              sizes="(max-width: 640px) calc(100vw - 72px), 520px"
              className="object-cover transition-transform duration-300 group-hover/media:scale-[1.01]"
              draggable={false}
            />
          </button>
        )
      ) : visuals.length > 1 && layout ? (
        <div className={`ui-enter grid gap-1 overflow-hidden rounded-2xl ${layout.grid} ${layout.container}`}>
          {shown.map((attachment, index) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              aria-label={`نمایش ${attachment.previewAlt ?? attachment.label}`}
              className={`group/tile relative min-h-0 overflow-hidden bg-surface-sunken ${layout.tiles[index] ?? ""}`}
            >
              {attachment.icon === "video" ? (
                <>
                  <video
                    src={attachment.previewSrc}
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
                  src={attachment.previewSrc as string}
                  alt={attachment.previewAlt ?? attachment.label}
                  fill
                  unoptimized={(attachment.previewSrc as string).startsWith("http")}
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

      {audios.map((attachment) => (
        <PostAudioAttachment key={attachment.id} attachment={attachment} artist={artist} cover={cover} />
      ))}

      {documents.map((attachment) => (
        <div
          key={attachment.id}
          className="mt-2.5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
            <FileText aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-[13px] font-bold text-foreground">{attachment.label}</strong>
            {attachment.detail ? (
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{attachment.detail}</span>
            ) : null}
          </span>
        </div>
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
