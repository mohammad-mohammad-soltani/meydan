import type { Metadata } from "next";
import { AdminSpeakerApplicationsView } from "@/features/admin/components/AdminSpeakerApplicationsView";
import { getSpeakerApplications } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "ثبت‌نام سخنرانان | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminSpeakerApplicationsPage() {
  // Fail-closed per page, like every other admin segment.
  if (!(await isAdministrator())) return null;

  const initial = await getSpeakerApplications("");
  return <AdminSpeakerApplicationsView initial={initial} />;
}
