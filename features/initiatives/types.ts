export type InitiativeParticipant = {
  /** `usr_9` / `sq_54` — actor key as returned by the API. */
  id: string;
  type: "user" | "square";
  name: string;
  avatarUrl?: string;
  verified: boolean;
  joinedAt?: string;
};

export type InitiativeParticipants = {
  items: InitiativeParticipant[];
  participantCount: number;
};
