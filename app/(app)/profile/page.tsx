import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { loginHref } from "@/lib/auth-navigation";
import { isAuthenticated } from "@/lib/meydan-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // Only a missing session means "log in again". Once a session exists, a
  // failing profile read must surface as an error instead of a login loop —
  // that is what happened to speaker accounts the service could not map.
  if (!(await isAuthenticated())) redirect(loginHref("/profile"));

  const profile = await getProfileDetails();
  const initialProfile = await hydrateSquareProfileMeta(profile);
  return <ProfileView initialProfile={initialProfile} />;
}
