import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfileDetails().catch(() => null);
  if (!profile) redirect("/auth");
  const initialProfile = await hydrateSquareProfileMeta(profile);
  return <ProfileView initialProfile={initialProfile} />;
}
