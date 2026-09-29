import type { Metadata } from "next";
import { AdminBannersView } from "@/features/admin/components/AdminBannersView";
import { getAdminBanners } from "@/features/admin/services/banners.service";
import { withAdminAuth } from "@/features/admin/services/admin-request";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "بنرها | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  if (!(await isAdministrator())) return null;
  const banners = await getAdminBanners(await withAdminAuth({ cache: "no-store" }));
  return <AdminBannersView initial={banners} />;
}
