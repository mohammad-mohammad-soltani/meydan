import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { isActorKind } from "@/lib/profile-route";
import { meydanApi } from "@/lib/meydan-api";

type ResolvedProfile = { actor_type: string; kind: string; id: number; handle: string };

/** Sends an old id-based profile address to `/{handle}`; 404 when the profile does not exist. */
export async function redirectToProfileById(type: string, id: string): Promise<never> {
  if (!isActorKind(type) || !/^\d+$/.test(id)) notFound();
  let handle = "";
  try {
    handle = (await meydanApi<ResolvedProfile>(`/profiles/by-id/${type}/${id}`)).handle;
  } catch {
    notFound();
  }
  if (!handle) notFound();
  redirect(`/${handle}` as Route);
}
