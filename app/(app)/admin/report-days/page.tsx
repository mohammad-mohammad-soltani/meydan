import type { Metadata } from "next";
import { AdminReportDaysView } from "@/features/admin/components/AdminReportDaysView";
import { getAdminReportDays } from "@/features/admin/services/report-days.service";
import { withAdminAuth } from "@/features/admin/services/admin-request";
import { isAdministrator } from "@/features/admin/server/require-administrator";
export const metadata: Metadata = { title: "گزارش | پنل مدیریت میدان" }; export const dynamic = "force-dynamic";
export default async function AdminReportDaysPage() { if (!(await isAdministrator())) return null; return <AdminReportDaysView initial={await getAdminReportDays(await withAdminAuth())} />; }
