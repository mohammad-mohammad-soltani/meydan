export type ProfileTab = "square" | "resume";
export type ProfileSection = "about" | "skills";

export type ProfileIdentity = {
  name: string;
  handle: string;
  subtitle: string;
  location: string;
  avatar: string;
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

export type ProfileDetails = {
  identity: ProfileIdentity;
  squareStats: ProfileStat[];
  resumeStats: ProfileStat[];
  schedule: SquareScheduleItem[];
  activity: ProfileActivity;
  about: string;
  skills: string[];
};