/** Topical category, as assigned in wp-admin. Admin-editable, so `slug` is an opaque string. */
export type SpeakerCategory = { slug: string; name: string };

/** `"all"` or a category slug. */
export type SpeakerFilter = string;

export type Speaker = {
  id: string;
  name: string;
  handle: string;
  cities: string[];
  /** Topical categories; a speaker may hold several. */
  categories: SpeakerCategory[];
  expertise: string;
  initials: string;
  avatarUrl?: string;
  accent: "slate" | "blue" | "amber" | "emerald";
  verified: boolean;
  /** Linked user account id. Absent when the profile has no account yet. */
  userId?: string;
};
