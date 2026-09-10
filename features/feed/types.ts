export type FeedTab = "for-you" | "following";
export type FeedFilter = "all" | "initiatives" | "reflected";
export type PostKind = "ideas" | "media";

export type FeedAttachment = {
  id: string;
  label: string;
  detail: string;
  icon: "image" | "video" | "article" | "microphone" | "bolt";
  previewSrc?: string;
  previewAlt?: string;
  width?: number;
  height?: number;
};

export type MediaReflection = {
  outlet: string;
  headline: string;
};

export type FeedPost = {
  id: string;
  author: { id: number; type: "user" | "square"; avatarUrl?: string; verified?: boolean };
  initiativeId?: number;
  initiativeParticipantCount?: number;
  viewerState?: { liked: boolean; reposted: boolean; joined: boolean };
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
    views: number;
  };
  callToAction?: string;
};

export type FollowSuggestion = {
  id: string;
  actorType?: "user" | "square";
  name: string;
  city: string;
  handle: string;
  description: string;
};
