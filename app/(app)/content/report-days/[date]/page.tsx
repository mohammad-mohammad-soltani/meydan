import { notFound } from "next/navigation";
import { ReportDayDetailView } from "@/features/content/components/ReportDayDetailView";
import { getReportDay } from "@/features/content/services/report-days.service";

export const dynamic = "force-dynamic";
export default async function ReportDayPage({ params }: { params: Promise<{ date: string }> }) { const { date } = await params; const detail = await getReportDay(date); if (!detail) notFound(); return <ReportDayDetailView detail={detail} />; }
