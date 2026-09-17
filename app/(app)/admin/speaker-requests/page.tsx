import type { Metadata } from "next";
import { AdminSpeakerRequestsView } from "@/features/admin/components/AdminSpeakerRequestsView";
import { getSpeakerRequests } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "درخواست‌های سخنرانی | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSpeakerRequestsPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const initial = await getSpeakerRequests({ status: "" });
  return <AdminSpeakerRequestsView surface="speaker-requests" initial={initial} />;
}
