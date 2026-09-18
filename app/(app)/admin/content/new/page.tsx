import type { Metadata } from "next";
import { AdminContentForm } from "@/features/admin/components/AdminContentForm";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "محتوای تازه | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminContentCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="محتوای تازه"
        description="محتوا را آماده کنید، رسانه‌ها را اضافه کنید و زمان نمایش آن به مخاطبان را تعیین کنید."
        crumbs={[{ label: "بسته محتوا", href: "/admin/content" }, { label: "محتوای تازه" }]}
      />
      <AdminContentForm />
    </div>
  );
}
