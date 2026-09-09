import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getProfileDetails } from "@/features/profile/services/profile.service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!(await cookies()).get("meydan_access")?.value) {
    redirect("/login?next=/profile");
  }

  try {
    return <ProfileView initialProfile={await getProfileDetails()} />;
  } catch {
    redirect("/login?next=/profile");
  }
}
