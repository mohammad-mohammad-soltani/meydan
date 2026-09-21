import { ReportDaysArchiveView } from "@/features/content/components/ReportDaysArchiveView";
import { currentReportNight, getReportDays } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";
export default async function ReportDaysPage() { const days = await getReportDays(); return <ReportDaysArchiveView days={days} todayNight={currentReportNight()} />; }
