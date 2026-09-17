import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminProgramForm } from "@/features/admin/components/AdminProgramForm";
import { getProgram } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ویرایش کمپین | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCampaignDetailPage({
params }: PageProps) {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const { id } = await params;
  const campaign = await getProgram("campaigns", id);
  if (!campaign) notFound();

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={campaign.title || `کمپین #${campaign.id}`}
        description="ویرایش کمپین، برنامه زمانی و محتوای پیوندشده."
        crumbs={[
          { label: "کمپین‌ها", href: "/admin/campaigns" },
          { label: campaign.title || `#${campaign.id}` },
        ]}
      />
      <AdminProgramForm kind="campaigns" program={campaign} />
    </div>
  );
}
