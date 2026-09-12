import { meydanApi } from "@/lib/meydan-api";
import type {
  CreateInvitationInput,
  InvitableSpeaker,
  InvitationActor,
  InvitationBox,
  SpeakerInvitation,
  SpeakerInvitationStatus,
} from "../types";

type ApiActor = {
  id?: string | null;
  type?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  verified_speaker?: boolean | null;
  /** Only sent by the API once the invitation is accepted. */
  phone?: string | null;
};

type ApiInvitation = {
  id: number | string;
  status?: string | null;
  speaker?: ApiActor | null;
  inviter?: ApiActor | null;
  initiative_id?: number | string | null;
  location?: string | null;
  message?: string | null;
  requested_date?: string | null;
  requested_time?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  phone_visible?: boolean | null;
};

type ApiSpeaker = {
  user_id: number | string;
  creator_id: number | string;
  actor?: ApiActor | null;
  role?: string | null;
  expertise?: string | null;
  verified_speaker?: boolean | null;
};

const STATUSES: SpeakerInvitationStatus[] = ["pending", "accepted", "rejected", "cancelled"];

function statusOf(value?: string | null): SpeakerInvitationStatus {
  const normalized = String(value || "").toLowerCase();
  return (STATUSES as string[]).includes(normalized)
    ? (normalized as SpeakerInvitationStatus)
    : "pending";
}

function mapActor(actor?: ApiActor | null): InvitationActor | null {
  if (!actor?.display_name) return null;

  const mapped: InvitationActor = {
    id: String(actor.id || ""),
    type: actor.type === "square" ? "square" : "user",
    name: String(actor.display_name),
    avatarUrl: actor.avatar_url || undefined,
    verified: Boolean(actor.verified),
    verifiedSpeaker: Boolean(actor.verified_speaker),
  };

  // Guard the privacy contract on the client too: only trust a phone when the
  // server explicitly flagged it as visible.
  if (actor.phone) mapped.phone = String(actor.phone);
  return mapped;
}

function mapInvitation(item: ApiInvitation): SpeakerInvitation {
  const phoneVisible = Boolean(item.phone_visible);
  const speaker = mapActor(item.speaker);
  if (speaker && !phoneVisible) delete speaker.phone;

  return {
    id: String(item.id),
    status: statusOf(item.status),
    speaker,
    inviter: mapActor(item.inviter),
    initiativeId: item.initiative_id ? String(item.initiative_id) : undefined,
    location: String(item.location || ""),
    message: String(item.message || ""),
    requestedDate: item.requested_date || undefined,
    requestedTime: item.requested_time || undefined,
    createdAt: item.created_at || undefined,
    acceptedAt: item.accepted_at || undefined,
    phoneVisible,
  };
}

export async function getSpeakerInvitations(box: InvitationBox): Promise<SpeakerInvitation[]> {
  const items = await meydanApi<ApiInvitation[]>(`/speaker-invitations?box=${box}`);
  return (items || []).map(mapInvitation);
}

export async function getInvitation(id: string): Promise<SpeakerInvitation> {
  return mapInvitation(await meydanApi<ApiInvitation>(`/speaker-invitations/${id}`));
}

export async function getInvitableSpeakers(query = ""): Promise<InvitableSpeaker[]> {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  const items = await meydanApi<ApiSpeaker[]>(`/speaker-invitations/speakers${suffix}`);
  return (items || [])
    .filter((item) => item.actor?.display_name)
    .map((item) => ({
      userId: String(item.user_id),
      creatorId: String(item.creator_id),
      name: String(item.actor?.display_name),
      avatarUrl: item.actor?.avatar_url || undefined,
      role: String(item.role || ""),
      expertise: String(item.expertise || ""),
      verifiedSpeaker: Boolean(item.verified_speaker),
    }));
}

export async function createInvitation(input: CreateInvitationInput): Promise<SpeakerInvitation> {
  const created = await meydanApi<ApiInvitation>("/speaker-invitations", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({
      speaker_user_id: Number(input.speakerUserId),
      initiative_id: input.initiativeId ? Number(input.initiativeId) : undefined,
      location: input.location,
      requested_date: input.requestedDate,
      requested_time: input.requestedTime,
      message: input.message || "",
    }),
  });
  return mapInvitation(created);
}

export async function decideInvitation(
  id: string,
  status: Extract<SpeakerInvitationStatus, "accepted" | "rejected">,
): Promise<SpeakerInvitation> {
  const updated = await meydanApi<ApiInvitation>(`/speaker-invitations/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return mapInvitation(updated);
}

export async function cancelInvitation(id: string): Promise<SpeakerInvitation> {
  const cancelled = await meydanApi<ApiInvitation>(`/speaker-invitations/${id}`, { method: "DELETE" });
  return mapInvitation(cancelled);
}
