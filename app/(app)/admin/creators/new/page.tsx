import type { Metadata } from "next";
import { AdminCreatorForm } from "@/features/admin/components/AdminCreatorForm";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "تولیدکننده تازه | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminCreatorCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="تولیدکننده تازه"
        description="ثبت یک تولیدکننده محتوا با نوع فعالیت، شهرها و پیوندهای اجتماعی."
        crumbs={[{ label: "تولیدکنندگان", href: "/admin/creators" }, { label: "تولیدکننده تازه" }]}
      />
      <AdminCreatorForm />
    </div>
  );
}
