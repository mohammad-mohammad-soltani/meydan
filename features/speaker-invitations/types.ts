export type SpeakerInvitationStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type InvitationActor = {
  id: string;
  type: "user" | "square";
  name: string;
  avatarUrl?: string;
  verified: boolean;
  verifiedSpeaker: boolean;
  /** Present only after acceptance and only for the inviter. */
  phone?: string;
};

export type SpeakerInvitation = {
  id: string;
  status: SpeakerInvitationStatus;
  speaker: InvitationActor | null;
  inviter: InvitationActor | null;
  initiativeId?: string;
  location: string;
  message: string;
  requestedDate?: string;
  requestedTime?: string;
  createdAt?: string;
  acceptedAt?: string;
  /** True only when the API actually released the contact number. */
  phoneVisible: boolean;
};

export type InvitableSpeaker = {
  userId: string;
  creatorId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  expertise: string;
  verifiedSpeaker: boolean;
};

export type InvitationBox = "received" | "sent";

export type CreateInvitationInput = {
  speakerUserId: string;
  initiativeId?: string;
  location: string;
  requestedDate: string;
  requestedTime: string;
  message?: string;
};
