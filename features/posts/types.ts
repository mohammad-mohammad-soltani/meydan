export type PostMediaKind = "image" | "video" | "microphone" | "article";
export type ReactionKind = "like" | "repost";

export type PostAuthor = {
  id: number;
  type: "user" | "square";
  name: string;
  handle: string;
  initials: string;
  verified: boolean;
  /** Red speaker badge — granted via the linked curated speaker profile. */
  verifiedSpeaker?: boolean;
  verifiedOfficial?: boolean;
  avatarUrl?: string;
};

export type PostMedia = {
  id: string;
  label: string;
  kind: PostMediaKind;
  detail?: string;
  previewSrc?: string;
  /** Real still for a video attachment, when the backend provides one. */
  posterSrc?: string;
  /** Audio source; plays through the shared bottom player. */
  audioSrc?: string;
  previewAlt?: string;
  width?: number;
  height?: number;
};

export type MediaReflection = {
  id: string;
  outlet: string;
  title: string;
  summary: string;
  accent: "blue" | "emerald" | "amber" | "red";
  url?: string;
  avatarUrl?: string;
};

export type PostComment = {
  id: string;
  author: string;
  authorId?: number;
  authorType?: "user" | "square";
  verified?: boolean;
  verifiedOfficial?: boolean;
  initials: string;
  timeAgo: string;
  content: string;
  isAuthor?: boolean;
  avatarUrl?: string;
};

export type PostDetail = {
  id: string;
  author: PostAuthor;
  outlet: string;
  badge: string;
  timeAgo: string;
  body: string;
  media: PostMedia[];
  reflections: MediaReflection[];
  likes: number;
  reposts: number;
  views: number;
  commentsCount: number;
  comments: PostComment[];
  /** The narrative is featured in the editorial collection. */
  editorial?: boolean;
  /** The narrative was published as standalone content. */
  isContent?: boolean;
  /** Id of the linked content post, when the narrative was converted. */
  contentId?: number | null;
  viewerState?: { liked: boolean; reposted: boolean };
};
