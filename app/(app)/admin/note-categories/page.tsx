import type { Metadata } from "next";
import { AdminNoteCategoriesView } from "@/features/admin/components/AdminNoteCategoriesView";
import { getNoteCategoriesServer } from "@/features/admin/services/admin-server";
import { isAdministrator } from "@/features/admin/server/require-administrator";

export const metadata: Metadata = { title: "دسته‌بندی یادداشت‌ها | پنل مدیریت میدان" };
export const dynamic = "force-dynamic";

export default async function AdminNoteCategoriesPage() {
  if (!(await isAdministrator())) return null;
  return <AdminNoteCategoriesView initial={await getNoteCategoriesServer()} />;
}
