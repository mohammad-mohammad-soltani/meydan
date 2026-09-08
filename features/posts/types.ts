export type PostMediaKind = "image" | "video" | "article";
export type ReactionKind = "like" | "repost";

export type PostAuthor = {
  name: string;
  handle: string;
  initials: string;
  verified: boolean;
};

export type PostMedia = {
  id: string;
  label: string;
  kind: PostMediaKind;
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
  likes: number;
  isAuthor?: boolean;
};

export type PostDetail = {
  id: string;
  author: PostAuthor;
  outlet: string;
  badge: string;
  body: string;
  media: PostMedia[];
  reflections: MediaReflection[];
  likes: number;
  reposts: number;
  comments: PostComment[];
};