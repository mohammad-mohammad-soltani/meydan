import type { Metadata } from "next";
import { AdminMemorialsView } from "@/features/admin/components/AdminMemorialsView";
import { getMemorials } from "@/features/admin/services/admin-server";
import { EMPTY_MEMORIAL_FILTERS } from "@/features/admin/types";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "یادبودها | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

/**
 * The first page is read on the server so the list is present on first paint;
 * the client view owns every subsequent filter/page fetch.
 */
export default async function AdminMemorialsPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const initialPage = await getMemorials(EMPTY_MEMORIAL_FILTERS, 1, 20);
  return <AdminMemorialsView initialPage={initialPage} />;
}
