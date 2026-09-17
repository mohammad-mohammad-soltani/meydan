import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminProgramForm } from "@/features/admin/components/AdminProgramForm";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "کمپین تازه | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminCampaignCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="کمپین تازه"
        description="ساخت کمپین با برنامه زمانی، برچسب‌ها و محتوای پیوندشده."
        crumbs={[{ label: "کمپین‌ها", href: "/admin/campaigns" }, { label: "کمپین تازه" }]}
      />
      <AdminProgramForm kind="campaigns" />
    </div>
  );
}
