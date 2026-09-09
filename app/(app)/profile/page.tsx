import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  return <ProfileView initialProfile={await getProfileDetails()} />;
}
