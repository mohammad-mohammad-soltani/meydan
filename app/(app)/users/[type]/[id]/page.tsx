import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { meydanApi } from "@/lib/meydan-api";
import { accessTokenHeader } from "@/lib/meydan-session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    type: "user" | "square";
    id: string;
  }>;
};

type ApiMeIdentity =
  | {
      account_type: "square";
      square?: { id?: number } | null;
    }
  | {
      account_type: "user" | "speaker";
      profile?: { id?: number } | null;
    };

async function isOwnProfile(type: "user" | "square", id: number): Promise<boolean> {
  const headers = await accessTokenHeader();
  if (!headers.Authorization || !Number.isFinite(id) || id <= 0) return false;

  try {
    const me = await meydanApi<ApiMeIdentity>("/me", { headers });
    const actorType = me.account_type === "square" ? "square" : "user";
    const actorId = me.account_type === "square" ? me.square?.id : me.profile?.id;

    return actorType === type && Number(actorId) === id;
  } catch {
    // Public profiles must remain accessible even if the optional self-check
    // fails because the session expired or `/me` is temporarily unavailable.
    return false;
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { type, id } = await params;

  if (type !== "user" && type !== "square") {
    notFound();
  }

  const numericId = Number(id);

  if (await isOwnProfile(type, numericId)) {
    redirect("/profile");
  }

  const profile = await getPublicProfileDetails(type, numericId);

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
