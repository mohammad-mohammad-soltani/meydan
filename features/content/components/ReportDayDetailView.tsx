import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarDays, FileText } from "lucide-react";
import type { ReportDayDetail } from "../services/report-days.service";
import { ReportPostCard } from "./ReportPostCard";

const digits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function ReportDayDetailView({ detail }: { detail: ReportDayDetail }) {
  const { day, items } = detail;
  return <main className="min-h-full bg-[#050505] pb-16 text-white" dir="rtl">
    <header className="relative overflow-hidden px-4 pb-8 pt-5 text-center"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.16),transparent_55%)]" /><Link href="/content/report-days" className="relative mx-auto flex w-fit items-center gap-1 text-xs text-white/60"><ArrowRight className="h-4 w-4" />روزشمار</Link><div className="relative mt-8 text-8xl font-black leading-none tracking-tight text-white/[.08]">{digits.format(day.nightNumber)}</div><div className="relative -mt-8"><div className="mx-auto flex w-fit items-center gap-2 text-xs text-white/60"><CalendarDays className="h-4 w-4" />شب {digits.format(day.nightNumber)}</div><h1 className="mt-4 text-2xl font-black leading-10">{day.title || "گزارش‌های شبانه"}</h1>{day.subtitle ? <p className="mt-1 text-sm text-white/70">{day.subtitle}</p> : null}{day.description ? <p className="mx-auto mt-4 max-w-xl text-xs leading-6 text-white/55">{day.description}</p> : null}</div></header>
    <div className="mx-4 h-px bg-white/15" />
    <section className="mx-auto max-w-2xl px-0 pt-6"><h2 className="mb-4 flex items-center gap-2 px-4 text-sm font-black"><FileText className="h-4 w-4 text-white/60" />گزارش‌های این شب</h2>{items.length ? <div className="overflow-hidden border-y border-white/15"><div className="divide-y divide-white/10">{items.map((item) => <ReportPostCard key={item.id} post={item} />)}</div></div> : <p className="mx-4 rounded-2xl border border-dashed border-white/20 p-6 text-center text-xs text-white/55">برای این شب هنوز گزارشی ثبت نشده است.</p>}</section>
  </main>;
}
