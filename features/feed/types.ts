export type FeedTab = "for-you" | "following";
export type FeedFilter = "all" | "ideas" | "media" | "visual" | "audio" | "initiatives";
export type PostKind = "ideas" | "media";

export type FeedAttachment = {
  id: string;
  label: string;
  detail: string;
  icon: "image" | "video" | "article" | "microphone" | "bolt";
  previewSrc?: string;
  previewAlt?: string;
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
  initiativeId?: string;
  actor?: { type: "user" | "square"; id: string };
  viewerState?: { liked: boolean; reposted: boolean };
};

export type FollowSuggestion = {
  id: string;
  actorType: "square";
  name: string;
  city: string;
  handle: string;
  description: string;
};
