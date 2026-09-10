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
  | { account_type: "user"; profile?: { id?: number } }
  | { account_type: "square"; square?: { id?: number } | null };

export function actorNumericId(value: string | number): number {
  const match = String(value).match(/(\d+)$/);
  return Number(match?.[1] || 0);
}

export function actorKey(type: ActorType, value: string | number): string {
  const id = actorNumericId(value);
  return `${type}:${id || String(value)}`;
}

export async function getViewerFollowing(): Promise<FollowActor[]> {
  const me = await meydanApi<MeResponse>("/me");
  const type: ActorType = me.account_type;
  const id = me.account_type === "square" ? me.square?.id : me.profile?.id;
  if (!id) return [];

  const response = await meydanApi<FollowActor[]>(`/actors/${type}/${id}/following`);
  return Array.isArray(response) ? response : [];
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
