import type { Metadata } from "next";
import { AdminFeedSettingsView } from "@/features/admin/components/AdminFeedSettingsView";
import { getFeedSettings } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "فید | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  // Fail closed before fetching the settings document, as every admin page does.
  if (!(await isAdministrator())) return null;

  const initial = await getFeedSettings();
  return <AdminFeedSettingsView initial={initial} />;
}
