import type { ActorKind } from "@/lib/profile-route";
export type InitiativeParticipant = {
  /** `usr_9` / `sq_54` — actor key as returned by the API. */
  id: string;
  type: ActorKind;
  handle?: string;
  name: string;
  avatarUrl?: string;
  verified: boolean;
  verifiedSpeaker?: boolean;
  verifiedOfficial?: boolean;
  joinedAt?: string;
};

export type InitiativeParticipants = {
  items: InitiativeParticipant[];
  participantCount: number;
};
