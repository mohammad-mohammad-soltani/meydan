import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSquareDetailView } from "@/features/admin/components/AdminSquareDetailView";
import { getSquare } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "جزئیات میدان | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminSquareDetailPage({ params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const square = await getSquare(id);
  // A missing square is a 404, not an error screen: the id is simply wrong.
  if (!square) notFound();

  return <AdminSquareDetailView square={square} />;
}
