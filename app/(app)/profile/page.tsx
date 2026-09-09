import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const initialProfile = await getProfileDetails().catch(() => null);
  if (!initialProfile) redirect("/auth");
  return <ProfileView initialProfile={initialProfile} />;
}
