import { notFound } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    type: "user" | "square";
    id: string;
  }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { type, id } = await params;

  if (type !== "user" && type !== "square") {
    notFound();
  }

  const profile = await getPublicProfileDetails(type, Number(id));

  if (!profile) {
    notFound();
  }

  const initialProfile = await hydrateSquareProfileMeta(profile);

  return (
    <ProfileView
      initialProfile={initialProfile}
      canManage={false}
    />
  );
}
