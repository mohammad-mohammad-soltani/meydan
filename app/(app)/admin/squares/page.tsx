import type { Metadata } from "next";
import { AdminSquaresView } from "@/features/admin/components/AdminSquaresView";
import { getSquares } from "@/features/admin/services/admin-server";
import { EMPTY_SQUARE_FILTERS } from "@/features/admin/types";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "میادین | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

/**
 * The first page is read on the server so the list is present on first paint;
 * the client view owns every subsequent filter/page fetch.
 */
export default async function AdminSquaresPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  // Squares only: other kinds have their own lists. Legacy squares have no kind and count as squares.
  const initialPage = await getSquares({ ...EMPTY_SQUARE_FILTERS, kind: "square" }, 1, 20);
  return <AdminSquaresView initialPage={initialPage} kind="square" />;
}
