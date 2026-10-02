import type { Metadata } from "next";
import { AdminSquaresView } from "@/features/admin/components/AdminSquaresView";
import { getSquares } from "@/features/admin/services/admin-server";
import { EMPTY_SQUARE_FILTERS } from "@/features/admin/types";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "سازمان‌ها | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  // Fail-closed per page, like every other admin route.
  if (!(await isAdministrator())) return null;

  const initialPage = await getSquares({ ...EMPTY_SQUARE_FILTERS, kind: "organization" }, 1, 20);
  return <AdminSquaresView initialPage={initialPage} kind="organization" />;
}
