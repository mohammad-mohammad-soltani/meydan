import { CalendarDays } from "lucide-react";
import type { ReportDay } from "../services/report-days.service";

const digits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function ReportDayCards({ days, compact = false }: { days: ReportDay[]; compact?: boolean }) {
  if (!days.length) return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">هنوز گزارش یا عنوانی برای شب‌ها ثبت نشده است.</p>;
  return <div className={compact ? "-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
    {days.map((day) => {
      const style = { backgroundColor: day.backgroundColor || "#000000", color: day.textColor || "#ffffff" };
      return <article key={day.date} style={style} className={`flex h-[118px] shrink-0 flex-col justify-between rounded-2xl border border-white/15 p-3 ${compact ? "w-[148px]" : "w-full"}`}>
        <div className="flex items-start justify-between gap-2"><span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">شب {digits.format(day.nightNumber)}</span><span className="text-3xl font-black opacity-25">{digits.format(day.nightNumber).padStart(2, "۰")}</span></div>
        <div><strong className="block truncate text-xs font-black">{day.title || "روزشمار تجمعات"}</strong><span className="mt-1 block truncate text-[10px] opacity-75">{day.subtitle || ""}</span></div>
      </article>;
    })}
  </div>;
}

export function ReportDaysHeading({ todayNight }: { todayNight: number }) {
  return <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-red-600"><CalendarDays className="h-4 w-4" /></span><h2 className="text-sm font-black">روزشمار تجمعات شبانه</h2></div><p className="mt-1 pr-9 text-[10px] text-muted-foreground">برنامه و محور محتوایی شب‌های تجمع</p></div><span className="pt-3 text-[11px] font-bold text-red-600">تمام {digits.format(todayNight)} شب</span></div>;
}
