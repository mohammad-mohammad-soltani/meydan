import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminMemorialDetailView } from "@/features/admin/components/AdminMemorialDetailView";
import { getMemorial } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "جزئیات یادبود | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminMemorialDetailPage({ params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const memorial = await getMemorial(id);
  // A missing memorial is a 404, not an error screen: the id is simply wrong.
  if (!memorial) notFound();

  return <AdminMemorialDetailView memorial={memorial} />;
}
