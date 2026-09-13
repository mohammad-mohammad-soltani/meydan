export type MediaKind = "image" | "video" | "audio" | "file";

/**
 * One media attachment in a shape every feature can produce.
 *
 * Feed attachments, post media and chat attachments are structurally different
 * but describe the same four things, so `mediaItemsFromAttachments` normalises
 * them here and every player/viewer in `features/media` consumes only this.
 */
export type MediaItem = {
  id: string;
  kind: MediaKind;
  /** Accessible name or file name. */
  title: string;
  /** Direct source: image src, video src or audio src. */
  src?: string;
  /** Poster/cover shown before a video or audio item starts. */
  poster?: string;
  /** Secondary line: size, format or a duration hint. */
  detail?: string;
  /** Intrinsic size when known; drives the frame before the file loads. */
  width?: number;
  height?: number;
  /** Explicit download target when it differs from `src`. */
  downloadHref?: string;
};

/**
 * Structural superset of `FeedAttachment` and `PostMedia`, so both can be
 * adapted without importing their feature types into this module.
 */
export type MediaAttachmentLike = {
  id: string;
  label?: string;
  detail?: string;
  icon?: string;
  previewSrc?: string;
  audioSrc?: string;
  previewAlt?: string;
  width?: number;
  height?: number;
};
