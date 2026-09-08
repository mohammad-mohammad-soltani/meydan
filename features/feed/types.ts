export type FeedTab = "for-you" | "following";
export type FeedFilter = "all" | "ideas" | "media";
export type PostKind = Exclude<FeedFilter, "all">;

export type FeedAttachment = {
  id: string;
  label: string;
  detail: string;
  icon: "image" | "video" | "article" | "microphone" | "bolt";
};

export type MediaReflection = {
  outlet: string;
  headline: string;
};

export type FeedPost = {
  id: string;
  kind: PostKind;
  squareName: string;
  handle: string;
  timeAgo: string;
  city: string;
  badge: string;
  title: string;
  body: string;
  attachments: FeedAttachment[];
  mediaReflection?: MediaReflection;
  stats: {
    likes: number;
    comments: number;
    reposts: number;
  };
  callToAction?: string;
};

export type FollowSuggestion = {
  id: string;
  name: string;
  city: string;
  handle: string;
  description: string;
};