import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { publicProfileHref } from "@/lib/profile-route";

type Props = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

/** Compatibility redirect for the previous /users/{type}/{id} scheme. */
export default async function LegacyUsersProfilePage({ params }: Props) {
  const { type, id } = await params;

  if ((type !== "user" && type !== "square") || !/^\d+$/.test(id)) {
    notFound();
  }

  redirect(publicProfileHref(type, id) as Route);
}
