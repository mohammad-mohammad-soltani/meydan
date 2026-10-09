import type { ApiQuotedNarrative } from "@/features/feed/services/quote-mapper";
import type { ApiTribute } from "@/features/feed/services/tribute-mapper";
import type { ProfileStat } from "../types";
import type { ActorKind } from "@/lib/profile-route";

type ApiSchedule = {
  id: number;
  title: string;
  starts_at: string;
  position?: number;
};

type ApiSquareLocation = {
  address?: string;
  province_id?: number;
  city_id?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
};

export type ApiSquare = {
  id: number;
  name: string;
  /** square | collective | media | organization; absent on older backends. */
  kind?: string;
  description?: string;
  verified?: boolean;
  avatar_url?: string;
  cover_url?: string;
  handle?: string;
  subtitle?: string;
  profile_about?: string;
  profile_skills?: string[];
  square_stats?: ProfileStat[];
  resume_stats?: ProfileStat[];
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: ApiSquareLocation | null;
  schedule?: ApiSchedule[];
  start_date?: string | null;
  handle_locked_until?: string | null;
  stats?: { active_nights?: number; narratives?: number };
  /** Memorial-only fields (`kind === "memorial"`). */
  biography?: string;
  birth_date?: string;
  death_date?: string;
  position?: string;
  office?: string;
  timeline?: Array<{ id?: string; date?: string; title?: string; place?: string; description?: string; photo_url?: string | null }>;
  frames?: Array<{ media_id: number; caption?: string; label?: string; url?: string | null }>;
};

export type ApiUserProfile = {
  id: number;
  handle?: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  headline?: string;
  verified?: boolean;
  verified_speaker?: boolean;
  /** Any speaker account, verified or not. */
  is_speaker?: boolean;
  verified_official?: boolean;
  location_label?: string;
  website?: string;
  handle_locked_until?: string | null;
  province_id?: number;
  city_id?: number;
  about?: string;
  skills?: string[];
  resume_stats?: ProfileStat[];
  stats?: {
    narratives?: number;
  };
};

/**
 * Speaker extra carried by `/me` for accounts holding the `meydan_speaker`
 * role. The speaker *is* the user account, so this only decorates `profile`.
 */
export type ApiSpeaker = {
  id: number;
  user_id?: number;
  name?: string;
  role?: string;
  bio?: string;
  handle?: string;
  avatar_url?: string;
  cover_url?: string;
  verified?: boolean;
  cities?: number[];
  social_links?: Array<{ platform?: string; url?: string; label?: string }>;
  categories?: Array<{ slug?: string; name?: string }>;
};

/** An entity account: square, media, collective or organization. */
export type ApiEntityMe = {
  account_type: "square" | "media" | "collective" | "organization";
  entity?: ApiSquare | null;
  /** Same payload as `entity`; only sent for squares. */
  square?: ApiSquare | null;
};

export type ApiMe =
  | ApiEntityMe
  | {
      account_type: "speaker";
      profile: ApiUserProfile;
      speaker?: ApiSpeaker | null;
    }
  | {
      account_type: "official";
      profile: ApiUserProfile;
    }
  | {
      account_type: "user";
      profile: ApiUserProfile;
    };

/** Follower/following counts and join date, as sent by `/me`, `/users/{id}` and entity profiles. */
export type ApiSocial = { followers?: number; following?: number; joined_at?: string | null };

export type ApiPublicUser = {
  id: number;
  social?: ApiSocial;
  actor: {
    avatar_url?: string;
    display_name?: string;
    verified?: boolean;
    verified_speaker?: boolean;
    is_speaker?: boolean;
    verified_official?: boolean;
  };
  profile: Omit<ApiUserProfile, "id" | "avatar_url" | "verified">;
};

/** `social` on any profile payload. */
export type WithSocial = { social?: ApiSocial };

export type ApiNarrative = {
  id: number;

  author?: {
    id?: string;
    type?: ActorKind;
    handle?: string;
    display_name?: string;
    avatar_url?: string;
    verified?: boolean;
  };

  body: string;
  published_at?: string | null;
  tags?: string[];

  attachments?: Array<{
    id: number;
    type?: string;
    label?: string;
    filename?: string;
    url?: string;
    poster_url?: string | null;
    thumbnail_url?: string | null;
    width?: number;
    height?: number;
  }>;

  media_reflections?: Array<{
    outlet: string;
    title: string;
    url?: string;
  }>;

  initiative?: {
    work_id?: string | null;
    work_closed?: boolean;
    id?: number;
    cta_label?: string;
    viewer_state?: {
      joined?: boolean;
    };
  } | null;

  viewer_state?: {
    liked?: boolean;
    reposted?: boolean;
    bookmarked?: boolean;
    can_delete?: boolean;
  } | null;

  stats?: {
    likes?: number;
    reposts?: number;
    quotes?: number;
    comments?: number;
    views?: number;
  };

  quoted_narrative?: ApiQuotedNarrative;

  tribute?: ApiTribute;

  /** Set when the profile owner reposted this narrative rather than wrote it. */
  reposted_at?: string;
};

export type ApiComment = {
  id: number;
  narrative_id: number;
  body: string;
  created_at?: string | null;
};

export type ApiMediaReflectionCount = {
  square_id: number;
  count: number;
};
