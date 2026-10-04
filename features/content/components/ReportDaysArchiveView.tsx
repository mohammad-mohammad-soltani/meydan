import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReportDay } from "../services/report-days.service";
import { ReportDayCards, ReportDaysHeading } from "./ReportDayCards";

export function ReportDaysArchiveView({ days }: { days: ReportDay[]; todayNight: number }) {
  return <main className="min-h-full bg-background px-3 pb-24 pt-5 text-foreground sm:px-4" dir="rtl"><Link href="/content" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ChevronRight className="h-4 w-4" />صفحه محتوا</Link><div className="mt-5"><ReportDaysHeading todayNight={days.length} /></div><div className="mt-5"><ReportDayCards days={days} /></div></main>;
}
