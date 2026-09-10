import { redirect } from "next/navigation";
import { ProfileEditView } from "@/features/profile/components/ProfileEditView";
import { getProfileDetails } from "@/features/profile/services/profile.service";
export const dynamic = "force-dynamic";
export default async function EditProfilePage() { const profile = await getProfileDetails().catch(() => null); if (!profile) redirect("/auth"); return <ProfileEditView profile={profile} />; }
