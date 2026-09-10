export type PostMediaKind = "image" | "video" | "article";
export type ReactionKind = "like" | "repost";

export type PostAuthor = {
  id: number;
  type: "user" | "square";
  name: string;
  handle: string;
  initials: string;
  verified: boolean;
  avatarUrl?: string;
};

export type PostMedia = {
  id: string;
  label: string;
  kind: PostMediaKind;
  detail?: string;
  previewSrc?: string;
  previewAlt?: string;
  width?: number;
  height?: number;
};

export type MediaReflection = {
  id: string;
  outlet: string;
  summary: string;
  accent: "blue" | "emerald" | "amber" | "red";
};

export type PostComment = {
  id: string;
  author: string;
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
  viewerState?: { liked: boolean; reposted: boolean };
};
