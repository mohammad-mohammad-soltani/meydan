import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCreatorForm } from "@/features/admin/components/AdminCreatorForm";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { getCreator } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ویرایش تولیدکننده | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCreatorDetailPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const creator = await getCreator(id);
  if (!creator) notFound();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={creator.name || `تولیدکننده #${creator.id}`}
        description="ویرایش پروفایل یا حذف تولیدکننده."
        crumbs={[
          { label: "تولیدکنندگان", href: "/admin/creators" },
          { label: creator.name || `#${creator.id}` },
        ]}
      />
      <AdminCreatorForm creator={creator} />
    </div>
  );
}
