import { notFound } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails, getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if ((type !== "user" && type !== "square") || !/^\d+$/.test(id)) notFound();
  const rawProfile = await getPublicProfileDetails(type, Number(id));
  if (!rawProfile) notFound();
  const profile = await hydrateSquareProfileMeta(rawProfile);
  const mine = await getProfileDetails().catch(() => null);
  const canManage = Boolean(mine && mine.actorId === profile.actorId && mine.accountType === profile.accountType);
  // Only a square account invites, and its own address is the invitation venue.
  const viewerIsSquare = mine?.accountType === "square";
  return (
    <ProfileView
      initialProfile={profile}
      canManage={canManage}
      canInvite={viewerIsSquare}
      inviteVenue={viewerIsSquare ? mine?.identity.location || "" : ""}
    />
  );
}
