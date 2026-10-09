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
  /** Any speaker account (verified or not): the only accounts a square can invite. */
  isSpeaker?: boolean;
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

/** One moment of a memorial's life story. */
export type MemorialTimelineItem = { id: string; date: string; title: string; place: string; description: string; photoUrl?: string };
/** One photo of a memorial's gallery («قاب‌های ماندگار»). */
export type MemorialFrameItem = { id: string; url: string; caption: string; label: string };

/** What only a یادبود (memorial) profile carries on top of the entity fields. */
export type ProfileMemorial = {
  /** One line under the name (the account headline); empty when none was written. */
  tagline: string;
  biography: string;
  birthDate: string;
  deathDate: string;
  /** سمت, e.g. «رئیس دانشگاه آزاد اسلامی». */
  position: string;
  /** منصب: the person's field or standing. */
  office: string;
  timeline: MemorialTimelineItem[];
  frames: MemorialFrameItem[];
};

export type ProfileDetails = {
  actorId: number;
  chatUserId?: number;
  accountType: ProfileTab;
  /** Entity kind of a square-type account (square, collective, media, organization). */
  kind?: string;
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
  narrativesDeferred?: boolean;
  /** Square stats and start date already came with the profile; no extra request is needed. */
  metaHydrated?: boolean;
  nextNarrativeCursor?: string | null;
  replies: ProfileReply[];
  about: string;
  skills: string[];
  /** Personal link shown in the edit form. */
  website?: string;
  /** When the handle may be changed again (ISO), or null when it may be changed now. */
  handleLockedUntil?: string | null;
  /** Follower/following counts and join date (reference-design header). */
  social?: ProfileSocial;
  /** Present only for `kind === "memorial"`; such profiles render through `MemorialProfileView`. */
  memorial?: ProfileMemorial;
  /** The account's pinned narrative, shown above its posts. */
  pinnedPost?: import("@/features/feed/types").FeedPost | null;
};

export type ProfileSocial = { followers: number; following: number; joinedAt?: string };
