import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminProgramForm } from "@/features/admin/components/AdminProgramForm";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ابتکار تازه | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminInitiativeCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="ابتکار تازه"
        description="ساخت ابتکار با برنامه زمانی، برچسب‌ها و محتوای پیوندشده."
        crumbs={[{ label: "ابتکارها", href: "/admin/initiatives" }, { label: "ابتکار تازه" }]}
      />
      <AdminProgramForm kind="initiatives" />
    </div>
  );
}
