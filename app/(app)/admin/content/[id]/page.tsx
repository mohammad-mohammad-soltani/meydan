import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminContentDetailView } from "@/features/admin/components/AdminContentDetailView";
import { getContent } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "جزئیات محتوا | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminContentDetailPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();

  return <AdminContentDetailView content={content} />;
}
