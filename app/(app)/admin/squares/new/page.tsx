import type { Metadata } from "next";
import { AdminSquareCreateForm } from "@/features/admin/components/AdminSquareCreateForm";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "افزودن میدان | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSquareCreatePage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return <AdminSquareCreateForm />;
}
