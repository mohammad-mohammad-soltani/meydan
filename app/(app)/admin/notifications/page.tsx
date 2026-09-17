import type { Metadata } from "next";
import { AdminBroadcastView } from "@/features/admin/components/AdminBroadcastView";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "پیام همگانی | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  return <AdminBroadcastView />;
}
