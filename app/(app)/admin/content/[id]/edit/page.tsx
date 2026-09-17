import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminContentForm } from "@/features/admin/components/AdminContentForm";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { getContent } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ویرایش محتوا | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminContentEditPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const content = await getContent(id);
  if (!content) notFound();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={`ویرایش «${content.title}»`}
        crumbs={[
          { label: "بسته محتوا", href: "/admin/content" },
          { label: `#${content.id}`, href: `/admin/content/${content.id}` },
          { label: "ویرایش" },
        ]}
      />
      <AdminContentForm content={content} />
    </div>
  );
}
