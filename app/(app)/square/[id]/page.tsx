import { PublicProfileRoute } from "@/features/profile/public-profile-route";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SquarePublicProfilePage({ params }: Props) {
  const { id } = await params;
  return <PublicProfileRoute type="square" id={id} />;
}
