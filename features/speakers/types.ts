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
  accent: "slate" | "blue" | "amber" | "emerald";
  verified: boolean;
};

export type ReservationRequest = {
  venue: string;
  timeSlot: string;
};

export type ReservationResult = {
  speakerId: string;
  submittedAt: string;
};