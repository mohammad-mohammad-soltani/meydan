export type ContentCategory = "featured" | "talks" | "audio" | "schedule";
export type ContentFilter = "all" | "ready" | "urgent";
export type MediaKind = "image" | "audio" | "document";
export type ContentStatus = "ready" | "urgent";

export type ContentMedia = {
  kind: MediaKind;
  duration?: string;
  audioSrc?: string;
  /** Proxied video source, played by the shared media player. */
  videoSrc?: string;
  videoWidth?: number;
  videoHeight?: number;
  description: string;
  coverImage?: string;
};

export type ContentCreator = {
  name: string;
  role: string;
  avatar?: string;
  /** Public actor page for content produced by a user or a square. */
  profileHref?: string;
  bio: string;
  publishedCount: string;
};

export type ContentFile = {
  id: string;
  url?: string;
  label: string;
  format: string;
  size: string;
  detail: string;
};

export type ContentItem = {
  id: string;
  apiId: number;
  contentType?: string | null;
  category: ContentCategory;
  status: ContentStatus;
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  author?: string;
  authorAvatar?: string;
  coverUrl?: string;
  /** «سلسله سخنرانی» the audio belongs to. */
  series?: string;
  /** Overrides the content page, e.g. «/posts/12» for audio that lives on a post. */
  href?: string;
  /** Minutes to read a note, from its word count. */
  readingMinutes?: number;
  publishedAt?: string;
  categoryName?: string;
  categorySlug?: string;
  bookmarked?: boolean;
  sourceNarrativeId?: number | null;
  media: ContentMedia;
};

export type ContentDetailItem = Omit<ContentItem, "category" | "media"> & {
  category: ContentCategory | "video";
  media: Omit<ContentMedia, "kind"> & { kind: MediaKind | "video" };
  creator: ContentCreator;
  publishedAt: string;
  location?: string;
  viewCount: string;
  downloadCount: string;
  body: string[];
  tags: string[];
  files: ContentFile[];
  usageNote: string;
  viewerState?: { bookmarked: boolean; liked?: boolean };
  likeCount?: number;
};

export type ScheduleItem = {
  id: string;
  night: string;
  number: string;
  title: string;
  description: string;
  current?: boolean;
};

export type ContentQuickAction = {
  id: string;
  label: string;
  detail: string;
  icon: "speakers" | "contact" | "print" | "safety";
  href?: string;
};

export type ContentPoster = { imageUrl: string | null; href: string };
