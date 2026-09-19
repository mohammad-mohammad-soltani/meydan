import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { hydrateSquareProfileMeta } from "@/features/profile/services/square-profile-meta.service";
import { meydanApi } from "@/lib/meydan-api";
import { accessTokenHeader } from "@/lib/meydan-session";

type PublicProfileType = "user" | "square";

type ApiMeIdentity =
  | {
      account_type: "square";
      square?: { id?: number } | null;
    }
  | {
      account_type: "user" | "speaker" | "official";
      profile?: { id?: number } | null;
    };

async function isOwnProfile(
  type: PublicProfileType,
  id: number,
): Promise<boolean> {
  const headers = await accessTokenHeader();
  if (!headers.Authorization || !Number.isFinite(id) || id <= 0) return false;

  try {
    const me = await meydanApi<ApiMeIdentity>("/me", { headers });
    const actorType = me.account_type === "square" ? "square" : "user";
    const actorId = me.account_type === "square" ? me.square?.id : me.profile?.id;

    return actorType === type && Number(actorId) === id;
  } catch {
    // Public profiles must stay available even if the optional session
    // self-check fails or the access token has expired.
    return false;
  }
}

export async function PublicProfileRoute({
  type,
  id,
}: {
  type: PublicProfileType;
  id: string;
}) {
  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    notFound();
  }

  if (await isOwnProfile(type, numericId)) {
    redirect("/profile");
  }

  const profile = await getPublicProfileDetails(type, numericId);
  if (!profile) {
    notFound();
  }

  const initialProfile = await hydrateSquareProfileMeta(profile);

  return <ProfileView initialProfile={initialProfile} canManage={false} />;
}
