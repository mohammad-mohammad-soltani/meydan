import { redirect } from "next/navigation";
import { ProfileEditView } from "@/features/profile/components/ProfileEditView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { loginHref } from "@/lib/auth-navigation";
import { isAuthenticated } from "@/lib/meydan-session";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  // Same contract as /profile: only a missing session redirects to login.
  if (!(await isAuthenticated())) redirect(loginHref("/profile/edit"));

  const profile = await hydrateSquareProfileMeta(await getProfileDetails());
  return <ProfileEditView profile={profile} />;
}
