import { MeydanApiError, meydanApi } from "@/lib/meydan-api";
import type { InitiativeParticipant, InitiativeParticipants } from "../types";

type ApiParticipant = {
  id?: string | number | null;
  type?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
  joined_at?: string | null;
};

type ApiParticipants = {
  items?: ApiParticipant[] | null;
  participant_count?: number | null;
};

/** `usr_9` / `sq_54` -> `/users/user/9` / `/users/square/54`. */
export function participantProfileHref(participant: Pick<InitiativeParticipant, "type" | "id">): string {
  const numericId = String(participant.id).match(/(\d+)$/)?.[1] || "";
  return `/users/${participant.type}/${numericId}`;
}

/**
 * Reads the people who joined a good-work initiative.
 *
 * Returns `null` when the initiative does not exist (so the route can 404) and
 * throws on transport/server failures, letting the route error boundary render
 * a retryable error state instead of a misleading "empty" list.
 */
export async function getInitiativeParticipants(initiativeId: string): Promise<InitiativeParticipants | null> {
  if (!/^\d+$/.test(initiativeId)) return null;

  let result: ApiParticipants;
  try {
    result = await meydanApi<ApiParticipants>(`/initiatives/${initiativeId}/participants`);
  } catch (reason) {
    if (reason instanceof MeydanApiError && reason.status === 404) return null;
    throw reason;
  }

  const items = (result.items || [])
    .filter((item): item is ApiParticipant & { id: string | number; display_name: string } =>
      Boolean(item?.id) && Boolean(item?.display_name))
    .map((item): InitiativeParticipant => ({
      id: String(item.id),
      type: item.type === "square" ? "square" : "user",
      name: String(item.display_name),
      avatarUrl: item.avatar_url || undefined,
      verified: Boolean(item.verified),
      joinedAt: item.joined_at || undefined,
    }));

  return {
    items,
    participantCount: Number(result.participant_count ?? items.length),
  };
}
