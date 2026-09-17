import type { Metadata } from "next";
import { AdminSquareMapView } from "@/features/admin/components/AdminSquareMapView";
import { getSquareMap } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "نقشه میادین | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSquareMapPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const initialPoints = await getSquareMap();
  return <AdminSquareMapView initialPoints={initialPoints} />;
}
