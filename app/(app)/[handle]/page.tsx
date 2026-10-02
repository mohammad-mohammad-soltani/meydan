import { notFound } from "next/navigation";
import { PublicProfileRoute } from "@/features/profile/public-profile-route";
import { meydanApi, MeydanApiError } from "@/lib/meydan-api";
import { redirectToProfileById } from "@/lib/profile-redirect";
import { actorKindOf, cleanHandle, isPublicProfilePath } from "@/lib/profile-route";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
};

type ResolvedProfile = { actor_type: string; kind: string; id: number; handle: string };

/**
 * Every public profile (user, speaker, official, square, media, collective,
 * organization) lives at `/{handle}`. The backend says which kind it is.
 */
export default async function ProfileByHandlePage({ params }: Props) {
  const { handle } = await params;

  // `/{number}` was the old user profile address.
  if (/^\d+$/.test(handle)) return redirectToProfileById("user", handle);

  const clean = cleanHandle(handle);
  if (!clean || !isPublicProfilePath(`/${clean}`)) notFound();

  let resolved: ResolvedProfile;
  try {
    resolved = await meydanApi<ResolvedProfile>(`/profiles/${clean}`);
  } catch (reason) {
    if (reason instanceof MeydanApiError && reason.status === 404) notFound();
    throw reason;
  }

  return <PublicProfileRoute type={actorKindOf(resolved.actor_type)} id={String(resolved.id)} />;
}
