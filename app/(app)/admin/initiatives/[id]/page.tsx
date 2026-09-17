import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminProgramForm } from "@/features/admin/components/AdminProgramForm";
import { getProgram } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ویرایش ابتکار | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminInitiativeDetailPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const initiative = await getProgram("initiatives", id);
  if (!initiative) notFound();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={initiative.title || `ابتکار #${initiative.id}`}
        description="ویرایش ابتکار، برنامه زمانی و محتوای پیوندشده."
        crumbs={[
          { label: "ابتکارها", href: "/admin/initiatives" },
          { label: initiative.title || `#${initiative.id}` },
        ]}
      />
      <AdminProgramForm kind="initiatives" program={initiative} />
    </div>
  );
}
