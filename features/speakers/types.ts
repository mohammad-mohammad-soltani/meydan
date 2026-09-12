export type SpeakerCategory = "faith" | "media" | "resistance";
export type SpeakerFilter = "all" | SpeakerCategory;

export type Speaker = {
  id: string;
  name: string;
  handle: string;
  cities: string[];
  category: SpeakerCategory;
  expertise: string;
  initials: string;
  avatarUrl?: string;
  accent: "slate" | "blue" | "amber" | "emerald";
  verified: boolean;
  /** Linked user account id. Absent when the profile has no account yet. */
  userId?: string;
};

export type ReservationRequest = {
  venue: string;
  timeSlot: string;
};

export type ReservationResult = {
  speakerId: string;
  submittedAt: string;
};
