import type { ActorKind } from "@/lib/profile-route";
export type FeedTab = "for-you" | "following";
export type FeedFilter = "all" | "narratives" | "initiatives" | "reflected";

export const FEED_FILTERS: readonly FeedFilter[] = ["all", "narratives", "initiatives", "reflected"];
export type PostKind = "ideas" | "media";

export type FeedAttachment = {
  id: string;
  label: string;
  detail: string;
  icon: "image" | "video" | "article" | "microphone" | "bolt";
  /** Image/video source. */
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
  outlet: string;
  outlets?: string[];
  headline: string;
  url?: string;
};

/** The narrative a quote embeds. `unavailable` when it was deleted or hidden. */
export type QuotedPost = {
  id: string;
  unavailable: boolean;
  author?: { id: number; type: ActorKind; handle?: string; name: string; avatarUrl?: string; verified?: boolean; verifiedSpeaker?: boolean; verifiedOfficial?: boolean };
  timeAgo?: string;
  body?: string;
  attachments?: FeedAttachment[];
};

export type FeedPost = {
  id: string;
  author: { id: number; type: ActorKind; handle?: string; avatarUrl?: string; verified?: boolean; verifiedSpeaker?: boolean; verifiedOfficial?: boolean };
  initiativeId?: number;
  initiativeWorkId?: string | null;
  initiativeClosed?: boolean;
  initiativeParticipantCount?: number;
  viewerState?: { liked: boolean; reposted: boolean; joined: boolean; canDelete?: boolean; bookmarked?: boolean };
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
    /** Quotes of this post; shown together with reposts on the repost button. */
    quotes?: number;
    views: number;
  };
  /** Set on a profile list when the profile owner reposted this post instead of writing it. */
  repostedAt?: string;
  /** Set when this post quotes another narrative. */
  quote?: QuotedPost;
  callToAction?: string;
};

export type FollowSuggestion = {
  id: string;
  actorType: ActorKind;
  name: string;
  city: string;
  handle: string;
  description: string;
  avatarUrl?: string;
  verified?: boolean;
  narrativeCount?: number;
  followerCount?: number;
};
