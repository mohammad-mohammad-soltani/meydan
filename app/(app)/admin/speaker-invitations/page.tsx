import type { Metadata } from "next";
import { AdminSpeakerRequestsView } from "@/features/admin/components/AdminSpeakerRequestsView";
import { getSpeakerInvitations } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "دعوت‌نامه‌های سخنران | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSpeakerInvitationsPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const initial = await getSpeakerInvitations({ status: "" });
  return <AdminSpeakerRequestsView surface="speaker-invitations" initial={initial} />;
}
