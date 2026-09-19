export type ProfileTab = "square" | "resume";
export type ProfileSection = "about" | "skills";

export type ProfileIdentity = {
  name: string;
  handle: string;
  subtitle: string;
  location: string;
  avatar?: string;
  cover?: string;
  verified: boolean;
  /** Red speaker badge — granted via the linked curated speaker profile. */
  verifiedSpeaker?: boolean;
  /** Grey badge for accounts with the Meydan official role. */
  verifiedOfficial?: boolean;
};

export type ProfileStat = { label: string; value: string; tone?: "default" | "success"; };

export type SquareScheduleItem = { id: string; title: string; time: string; highlighted?: boolean; startsAt?: string; };

export type ProfileActivity = {
  id: string;
  authorLabel: string;
  timeLabel: string;
  content: string;
  tags: string[];
  likes: number;
  reposts: number;
  comments: number;
};

export type ProfileNarrative = ProfileActivity;

export type ProfileReply = { id: string; narrativeId: string; content: string; timeLabel: string };

export type ProfileDetails = {
  actorId: number;
  chatUserId?: number;
  accountType: ProfileTab;
  provinceId?: number;
  cityId?: number;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  initialTab?: ProfileTab;
  identity: ProfileIdentity;
  squareStats: ProfileStat[];
  resumeStats: ProfileStat[];
  schedule: SquareScheduleItem[];
  activity: ProfileActivity;
  narratives: ProfileNarrative[];
  narrativePosts: import("@/features/feed/types").FeedPost[];
  narrativeCount?: number | null;
  nextNarrativeCursor?: string | null;
  replies: ProfileReply[];
  about: string;
  skills: string[];
};
