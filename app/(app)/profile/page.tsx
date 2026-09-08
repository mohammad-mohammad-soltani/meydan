import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";

export default function ProfilePage() {
  return <ProfileView initialProfile={getProfileDetails()} />;
}
