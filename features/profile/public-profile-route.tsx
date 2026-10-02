import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { getPublicProfileDetails } from "@/features/profile/services/profile.service";
import { meydanApi } from "@/lib/meydan-api";
import { accessTokenHeader } from "@/lib/meydan-session";
import { isEntityKind, type ActorKind } from "@/lib/profile-route";

type PublicProfileType = ActorKind;

type ApiMeIdentity = {
  account_type: string;
  /** Profile of an entity account of any kind (square, media, collective, organization). */
  entity?: { id?: number } | null;
  square?: { id?: number } | null;
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
    if (isEntityKind(type)) {
      return me.account_type === type && Number((me.entity ?? me.square)?.id) === id;
    }
    return !isEntityKind(me.account_type) && Number(me.profile?.id) === id;
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

  const [ownProfile, profile] = await Promise.all([
    isOwnProfile(type, numericId),
    getPublicProfileDetails(type, numericId),
  ]);
  if (ownProfile) {
    redirect("/profile");
  }
  if (!profile) {
    notFound();
  }

  return <ProfileView initialProfile={profile} canManage={false} />;
}
