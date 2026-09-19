import { PublicProfileRoute } from "@/features/profile/public-profile-route";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserPublicProfilePage({ params }: Props) {
  const { id } = await params;
  return <PublicProfileRoute type="user" id={id} />;
}
