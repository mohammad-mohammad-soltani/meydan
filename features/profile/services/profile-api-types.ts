import type { ApiQuotedNarrative } from "@/features/feed/services/quote-mapper";
import type { ProfileStat } from "../types";

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
  stats?: { active_nights?: number; narratives?: number };
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
  verified_official?: boolean;
  location_label?: string;
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

export type ApiMe =
  | {
      account_type: "square";
      square: ApiSquare | null;
    }
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

export type ApiPublicUser = {
  id: number;
  actor: {
    avatar_url?: string;
    display_name?: string;
    verified?: boolean;
    verified_speaker?: boolean;
    verified_official?: boolean;
  };
  profile: Omit<ApiUserProfile, "id" | "avatar_url" | "verified">;
};

export type ApiNarrative = {
  id: number;

  author?: {
    id?: string;
    type?: "user" | "square";
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
