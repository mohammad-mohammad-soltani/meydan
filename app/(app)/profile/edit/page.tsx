import { redirect } from "next/navigation";
import { ProfileEditView } from "@/features/profile/components/ProfileEditView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { loginHref } from "@/lib/auth-navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const rawProfile = await getProfileDetails().catch(() => null);
  if (!rawProfile) redirect(loginHref("/profile/edit"));
  const profile = await hydrateSquareProfileMeta(rawProfile);
  return <ProfileEditView profile={profile} />;
}
