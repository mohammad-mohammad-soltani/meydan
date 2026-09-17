import type { Metadata } from "next";
import { AdminSpeakersView } from "@/features/admin/components/AdminSpeakersView";
import { EMPTY_SPEAKER_FILTERS } from "@/features/admin/services/speakers.service";
import { getAdminSpeakers } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "سخنرانان | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSpeakersPage() {
  // Fail-closed per page: the layout gate alone does not stop this segment from
  // rendering, so no query runs and nothing is shown without the role.
  if (!(await isAdministrator())) return null;

  const initial = await getAdminSpeakers(EMPTY_SPEAKER_FILTERS);
  return <AdminSpeakersView initial={initial} />;
}
