import type { Metadata } from "next";
import { AdminMemorialCreateForm } from "@/features/admin/components/AdminMemorialCreateForm";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "افزودن یادبود | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminMemorialCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return <AdminMemorialCreateForm />;
}
