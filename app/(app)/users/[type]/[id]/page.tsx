import { redirectToProfileById } from "@/lib/profile-redirect";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

/** Compatibility redirect for links created before `/{handle}` addresses. */
export default async function LegacyPublicProfilePage({ params }: Props) {
  const { type, id } = await params;
  return redirectToProfileById(type, id);
}
