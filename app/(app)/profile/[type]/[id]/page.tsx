import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

/**
 * Compatibility route for links created before public profiles moved to
 * `/users/[type]/[id]`. The personal `/profile` route remains separate.
 */
export default async function LegacyPublicProfilePage({ params }: Props) {
  const { type, id } = await params;

  if (
    (type !== "user" && type !== "square") ||
    !/^\d+$/.test(id)
  ) {
    notFound();
  }

  redirect(`/users/${type}/${id}`);
}
