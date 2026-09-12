import type { FeedAttachment } from "../../types";

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

/** Images and video that can be shown in the gallery grid. */
export function isVisualAttachment(attachment: FeedAttachment): boolean {
  return (attachment.icon === "image" || attachment.icon === "video") && Boolean(attachment.previewSrc);
}

/** Audio attachments play through the shared bottom player. */
export function isAudioAttachment(attachment: FeedAttachment): boolean {
  return attachment.icon === "microphone" && Boolean(attachment.audioSrc);
}
