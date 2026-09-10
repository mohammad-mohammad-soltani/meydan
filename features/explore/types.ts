export type ExploreResultKind =
  | "narrative"
  | "square"
  | "creator"
  | "content"
  | "user"
  | "topic";

export type ExploreFilter = "all" | ExploreResultKind;

export type ExploreResult = {
  id: string;
  entityId: string;
  kind: ExploreResultKind;
  title: string;
  subtitle: string;
  href: string;
  avatarUrl?: string;
  imageUrl?: string;
  verified?: boolean;
  meta?: string;
};

export type ExploreTrend = {
  id: string;
  title: string;
  body: string;
  href: string;
  authorName: string;
  authorAvatar?: string;
  verified?: boolean;
  tag?: string;
  meta?: string;
};

export type ExploreLanding = {
  suggestions: ExploreResult[];
  content: ExploreResult[];
  topics: ExploreResult[];
  trends: ExploreTrend[];
};
