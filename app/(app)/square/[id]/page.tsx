import { redirectToProfileById } from "@/lib/profile-redirect";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

/** Old square address; profiles now live at `/{handle}`. */
export default async function LegacySquareProfilePage({ params }: Props) {
  const { id } = await params;
  return redirectToProfileById("square", id);
}
