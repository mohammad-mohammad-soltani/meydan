import { notFound } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails, getPublicProfileDetails } from "@/features/profile/services/profile.service";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if ((type !== "user" && type !== "square") || !/^\d+$/.test(id)) notFound();
  const profile = await getPublicProfileDetails(type, Number(id));
  if (!profile) notFound();
  const mine = await getProfileDetails().catch(() => null);
  const canManage = Boolean(mine && mine.actorId === profile.actorId && mine.accountType === profile.accountType);
  return <ProfileView initialProfile={profile} canManage={canManage} />;
}
