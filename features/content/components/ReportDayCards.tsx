import { CalendarDays, ChevronLeft } from "lucide-react";
import type { ReportDay } from "../services/report-days.service";
import Link from "next/link";
import type { Route } from "next";

const digits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function ReportDayCards({ days, compact = false }: { days: ReportDay[]; compact?: boolean }) {
  if (!days.length) return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">هنوز گزارش یا عنوانی برای شب‌ها ثبت نشده است.</p>;
  return <div className={compact ? "no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
    {days.map((day) => {
      const style = { backgroundColor: day.backgroundColor || "#000000", color: day.textColor || "#ffffff" };
      return <Link href={`/content/report-days/${day.date}` as Route} key={day.date} style={style} className={`relative flex h-[150px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-4 ${compact ? "w-[236px]" : "w-full"}`}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.28),transparent_60%)]" />
        <span className="relative text-right"><big className="block text-[44px] font-black leading-none">{digits.format(day.nightNumber)}</big><em className="mt-0.5 block text-xs not-italic opacity-80">شب</em></span>
        <span className="relative flex items-center justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 backdrop-blur"><ChevronLeft aria-hidden="true" className="h-4 w-4" /></span><b className="min-w-0 truncate text-sm font-black">{day.title || "روزشمار تجمعات"}</b></span>
      </Link>;
    })}
  </div>;
}

export function ReportDaysHeading({ todayNight }: { todayNight: number }) {
  return <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-red-600"><CalendarDays className="h-4 w-4" /></span><h2 className="text-sm font-black">روزشمار تجمعات شبانه</h2></div><p className="mt-1 pr-9 text-[10px] text-muted-foreground">برنامه و محور محتوایی شب‌های تجمع</p></div><span className="pt-3 text-[11px] font-bold text-red-600">تمام {digits.format(todayNight)} شب</span></div>;
}
