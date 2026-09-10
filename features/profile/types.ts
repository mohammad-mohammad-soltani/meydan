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
};

export type ProfileStat = { label: string; value: string; tone?: "default" | "success"; };

export type SquareScheduleItem = { id: string; title: string; time: string; highlighted?: boolean; };

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
  accountType: ProfileTab;
  provinceId?: number;
  cityId?: number;
  latitude?: number;
  longitude?: number;
  initialTab?: ProfileTab;
  identity: ProfileIdentity;
  squareStats: ProfileStat[];
  resumeStats: ProfileStat[];
  schedule: SquareScheduleItem[];
  activity: ProfileActivity;
  narratives: ProfileNarrative[];
  narrativePosts: import("@/features/feed/types").FeedPost[];
  replies: ProfileReply[];
  about: string;
  skills: string[];
};
