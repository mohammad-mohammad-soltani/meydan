"use client";

import { AlertCircle, LoaderCircle, Mic, Play, RefreshCw, X } from "lucide-react";
import type { ComposeMedia } from "../hooks/useComposeMedia";

type TileLayout = {
  /** Classes for the grid element itself. */
  grid: string;
  /** Aspect (or nothing) for the grid element — tiles stretch to fill it. */
  container?: string;
  /** Per-tile span classes, by index. */
  tiles: string[];
};

const LAYOUTS: Record<number, TileLayout> = {
  1: { grid: "grid-cols-1", tiles: ["aspect-[16/10]"] },
  2: { grid: "grid-cols-2 grid-rows-1", container: "aspect-[16/9]", tiles: ["", ""] },
  3: { grid: "grid-cols-2 grid-rows-2", container: "aspect-[16/10]", tiles: ["row-span-2", "", ""] },
  4: { grid: "grid-cols-2 grid-rows-2", container: "aspect-square", tiles: ["", "", "", ""] },
  // Two wide tiles over three narrower ones.
  5: {
    grid: "grid-cols-6 grid-rows-2",
    container: "aspect-[16/10]",
    tiles: ["col-span-3", "col-span-3", "col-span-2", "col-span-2", "col-span-2"],
  },
};

/**
 * Attachment preview: one large tile, then 2-up / 1+2 / 2×2 / 2+3, each with
 * its own upload state and a remove button.
 */
export function ComposeMediaGrid({
  media,
  onRemove,
  onRetry,
}: {
  media: ComposeMedia[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  if (!media.length) return null;
  const count = media.length;
  const layout = LAYOUTS[count] ?? LAYOUTS[4];

  return (
    <div
      className={`ui-enter mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${layout.grid} ${layout.container ?? ""}`}
    >
      {media.map((item, index) => (
        <div
          key={item.id}
          className={`relative min-h-0 overflow-hidden bg-surface-sunken ${count > 1 ? "h-full w-full" : ""} ${layout.tiles[index] ?? ""}`}
        >
          {item.kind === "video" ? (
            <video src={item.previewUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : item.kind === "audio" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-muted text-brand">
                <Mic aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-[10px] leading-4 text-foreground-subtle">{item.file.name}</span>
            </div>
          ) : (
            // A blob: preview cannot go through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
          )}

          {item.kind === "video" && item.status === "ready" ? (
            <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-scrim/70 text-on-solid backdrop-blur">
              <Play className="h-3.5 w-3.5" />
            </span>
          ) : null}

          {item.status === "uploading" ? (
            <div className="absolute inset-0 grid place-items-center bg-scrim/55 backdrop-blur-[1px]">
              <span className="flex items-center gap-2 rounded-pill bg-scrim/70 px-3 py-1.5 text-[10px] font-black text-on-solid">
                <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                {Math.round(item.progress * 100).toLocaleString("fa-IR")}٪
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-1 rounded-full bg-brand transition-[width]"
                style={{ width: `${Math.max(4, Math.round(item.progress * 100))}%` }}
              />
            </div>
          ) : null}

          {item.status === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim/75 p-3 text-center">
              <AlertCircle aria-hidden="true" className="h-5 w-5 text-danger" />
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                className="inline-flex items-center gap-1 rounded-pill bg-surface px-3 py-1.5 text-[10px] font-black text-foreground transition-colors hover:bg-hover"
              >
                <RefreshCw aria-hidden="true" className="h-3 w-3" />
                تلاش دوباره
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`حذف ${item.file.name}`}
            className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-scrim/80 text-on-solid backdrop-blur transition-colors hover:bg-scrim"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
