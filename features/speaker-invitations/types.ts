export type SpeakerInvitationStatus = "pending" | "accepted" | "rejected" | "cancelled";

/** Reuses the speakers feature shape; categories are admin-editable so slug is opaque. */
export type SpeakerCategory = { slug: string; name: string };

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
  /** Topical categories; the picker filters on these. */
  categories: SpeakerCategory[];
  verifiedSpeaker: boolean;
};

export type InvitationBox = "received" | "sent";

/**
 * The venue is not part of the input: the API derives it from the inviting
 * square's own registered address.
 */
export type CreateInvitationInput = {
  speakerUserId: string;
  initiativeId?: string;
  requestedDate: string;
  requestedTime: string;
  message?: string;
};
