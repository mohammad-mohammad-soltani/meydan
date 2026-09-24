import { meydanApi } from "@/lib/meydan-api";

export type ActorType = "user" | "square";

export type FollowActor = {
  id: string;
  type: ActorType;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
};

type MeResponse =
  | { account_type: "user" | "speaker"; profile?: { id?: number } }
  | { account_type: "square"; square?: { id?: number } | null };

export function actorNumericId(value: string | number): number {
  const match = String(value).match(/(\d+)$/);
  return Number(match?.[1] || 0);
}

export function actorKey(type: ActorType, value: string | number): string {
  const id = actorNumericId(value);
  return `${type}:${id || String(value)}`;
}

/**
 * Resolves the `/me` payload to the actor key follows are stored under.
 *
 * A speaker account is a `user` actor: interactions are keyed on `user|square`,
 * and `/actors/{type}` has no `speaker` route.
 */
export function viewerActor(me: MeResponse): { type: ActorType; id?: number } {
  if (me.account_type === "square") {
    return { type: "square", id: me.square?.id };
  }
  return { type: "user", id: me.profile?.id };
}

export async function getFollowingStates(actors: Array<{ type: ActorType; id: number }>): Promise<{ keys: string[]; hasFollowing: boolean }> {
  const unique = Array.from(new Map(actors.filter(({ id }) => id > 0).map((actor) => [actorKey(actor.type, actor.id), actor])).values()).slice(0, 100);
  const result = await meydanApi<{ following_keys: string[]; has_following: boolean }>("/actors/follow-states", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actors: unique }),
  });
  return { keys: result.following_keys || [], hasFollowing: Boolean(result.has_following) };
}

export async function getActorFollowing(type: ActorType, value: string | number): Promise<boolean> {
  const id = actorNumericId(value);
  if (!id) throw new Error("Invalid actor id");

  const result = await meydanApi<{ following: boolean }>(`/actors/${type}/${id}/follow-state`);
  return result.following === true;
}

export async function setActorFollowing(type: ActorType, value: string | number, following: boolean): Promise<void> {
  const id = actorNumericId(value);
  if (!id) throw new Error("Invalid actor id");

  await meydanApi(`/actors/${type}/${id}/follow`, {
    method: following ? "PUT" : "DELETE",
    headers: {
      "content-type": "application/json",
    },
  });
}
