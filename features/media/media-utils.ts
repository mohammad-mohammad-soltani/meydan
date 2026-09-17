import type { MediaAttachmentLike, MediaItem, MediaKind } from "./types";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function faDigits(value: string): string {
  return value.replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

/** `92` -> `۱:۳۲` (Persian digits). */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const value = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;

  return faDigits(value);
}

/** Clamped intrinsic ratio, so a very tall or wide upload still frames well. */
export function mediaAspectRatio(width?: number, height?: number, fallback = 16 / 9): number {
  if (!width || !height || width <= 0 || height <= 0) return fallback;
  return Math.min(16 / 9, Math.max(4 / 5, width / height));
}

/** Preserve the decoded video's real proportions; gallery tile crops use mediaAspectRatio instead. */
export function videoAspectRatio(width?: number, height?: number): number {
  return width && height && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? width / height
    : 16 / 9;
}

function lastRangeEnd(ranges: TimeRanges): number {
  if (!ranges.length) return 0;

  try {
    const end = ranges.end(ranges.length - 1);
    return Number.isFinite(end) && end > 0 ? end : 0;
  } catch {
    return 0;
  }
}

/** Video metadata can be flaky; fall back to seekable/buffered ranges. */
export function resolveMediaDuration(video: HTMLVideoElement): number {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;

  const seekableEnd = lastRangeEnd(video.seekable);
  if (seekableEnd > 0) return seekableEnd;

  const bufferedEnd = lastRangeEnd(video.buffered);
  if (bufferedEnd > 0) return bufferedEnd;

  return 0;
}

/** How far the browser has buffered, for the progress track's second layer. */
export function resolveBufferedEnd(video: HTMLVideoElement): number {
  return lastRangeEnd(video.buffered) || lastRangeEnd(video.seekable);
}

const kindByIcon: Record<string, MediaKind> = {
  image: "image",
  video: "video",
  microphone: "audio",
  audio: "audio",
  article: "file",
  document: "file",
  file: "file",
  bolt: "file",
};

function posterForVideo(src?: string, posterSrc?: string): string | undefined {
  if (!posterSrc || posterSrc === src) return undefined;
  return posterSrc;
}

export function mediaItemsFromAttachments(attachments: MediaAttachmentLike[]): MediaItem[] {
  return attachments.map((attachment) => {
    const kind = kindByIcon[attachment.icon || ""] || "file";
    const src = kind === "audio" ? attachment.audioSrc : attachment.previewSrc;

    return {
      id: attachment.id,
      kind,
      title: attachment.previewAlt || attachment.label || defaultTitle(kind),
      src,
      poster: kind === "video" ? posterForVideo(src, attachment.posterSrc) : undefined,
      detail: attachment.detail,
      width: attachment.width,
      height: attachment.height,
      downloadHref: kind === "file" ? src : undefined,
    };
  });
}

export type NamedAttachmentLike = {
  id: string;
  name?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  previewUrl?: string;
  posterSrc?: string;
  width?: number;
  height?: number;
  duration?: number;
};

function kindFromMime(mimeType?: string): MediaKind {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export function formatFileSize(size?: number): string {
  const value = Number(size || 0);
  if (value <= 0) return "";
  if (value < 1024 * 1024) return `${faDigits(String(Math.max(1, Math.round(value / 1024))))} کیلوبایت`;
  return `${faDigits((value / (1024 * 1024)).toFixed(1))} مگابایت`;
}

export function mediaItemFromNamedAttachment(attachment: NamedAttachmentLike): MediaItem {
  const kind = kindFromMime(attachment.mimeType);
  const src = attachment.url || attachment.previewUrl;

  return {
    id: attachment.id,
    kind,
    title: attachment.name || defaultTitle(kind),
    src,
    poster: kind === "video" ? posterForVideo(src, attachment.posterSrc) : undefined,
    detail: formatFileSize(attachment.size) || undefined,
    width: attachment.width,
    height: attachment.height,
    downloadHref: kind === "file" ? src : undefined,
  };
}

function defaultTitle(kind: MediaKind): string {
  if (kind === "image") return "تصویر";
  if (kind === "video") return "ویدیو";
  if (kind === "audio") return "فایل صوتی";
  return "فایل ضمیمه";
}

export function visualItems(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => (item.kind === "image" || item.kind === "video") && Boolean(item.src));
}

export const MEDIA_THUMB_WIDTH = 640;
export const MEDIA_THUMB_QUALITY = 65;

export function mediaThumbnailSrc(src?: string, width = MEDIA_THUMB_WIDTH): string | undefined {
  if (!src || !/^https?:\/\//i.test(src)) return undefined;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${MEDIA_THUMB_QUALITY}`;
}

export function audioItems(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => item.kind === "audio" && Boolean(item.src));
}

export function fileItems(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => item.kind === "file");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
