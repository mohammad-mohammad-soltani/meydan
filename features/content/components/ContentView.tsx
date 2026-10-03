import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { AudioLines, BookOpen, CalendarDays, ChevronLeft, Clock, FileText, Mic, Phone, PhoneCall, Send } from "lucide-react";
import { HubBanners } from "./HubBanners";
import type { ContentBanner } from "../services/banners.service";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { ContentItem } from "../types";
import { MusicVideoStrip } from "./MusicVideoCards";
import type { ReportDay } from "../services/report-days.service";
import { ReportDayCards } from "./ReportDayCards";

export function SpeechRows({ items }: { items: ContentItem[] }) {
  if (!items.length) return <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">هنوز سخنرانی‌ای منتشر نشده است.</p>;
  return (
    <div className="overflow-hidden flex flex-col gap-2   bg-surface" dir="rtl">
      {items.map((item) => (
        <Link key={item.apiId} href={`/content/${item.apiId}` as Route} className="flex min-h-20 items-center gap-3 border border-divider px-3 py-2.5 transition-colors rounded-xl hover:bg-hover">
          {item.authorAvatar ? <OptimizedAvatar src={item.authorAvatar} alt="" width={40} className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-black">{(item.author || item.title).slice(0, 1)}</span>}
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-black text-foreground">{item.title}</strong>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">{item.author || item.title}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-[10px] font-bold text-foreground-secondary"><FileText className="h-3.5 w-3.5" />فیش</span>
        </Link>
      ))}
    </div>
  );
}

const ACTIONS: Array<{ label: string; icon: typeof Mic; tone: string; href?: Route; soon?: boolean }> = [
  { label: "اعزام سخنران", icon: Mic, tone: "bg-violet-500", href: "/speakers" as Route },
  { label: "پویش", icon: Send, tone: "bg-emerald-500", href: "/home?filter=initiatives" as Route },
  { label: "بیست‌کال", icon: PhoneCall, tone: "bg-sky-500", soon: true },
  { label: "ارتباط با ما", icon: Phone, tone: "bg-pink-500", soon: true },
];

function SectionHead({ icon: Icon, title, hint, action }: { icon: typeof BookOpen; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-muted text-foreground-secondary"><Icon aria-hidden="true" className="h-[18px] w-[18px]" /></span>
      <div className="min-w-0 flex-1"><h2 className="text-base font-black text-foreground">{title}</h2><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p></div>
      {action}
    </div>
  );
}

function PillLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href as Route} className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-[11px] font-bold text-foreground-secondary transition-colors hover:bg-hover">{children}<ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" /></Link>;
}

/** «پیشخوان»: banners, quick actions, the nights counter, short talks and the picked audio. */
export function ContentView({ banners, speeches, musicVideos, reportDays, todayNight }: { banners: ContentBanner[]; speeches: ContentItem[]; musicVideos: ContentItem[]; reportDays: ReportDay[]; todayNight: number }) {
  return (
    <div className="pb-24 text-foreground" dir="rtl">
      <HubBanners banners={banners} />

      <div className="mt-5 grid grid-cols-4 gap-1 px-3" aria-label="خدمات محتوا">
        {ACTIONS.map(({ label, icon: Icon, tone, href, soon }) => {
          const body = (
            <>
              <span className={`relative grid h-[60px] w-[60px] place-items-center rounded-full text-white ${tone} ${soon ? "opacity-60" : ""}`}><Icon aria-hidden="true" className="h-6 w-6" /></span>
              <span className="mt-2 truncate text-[11px] font-black">{label}</span>
              {soon ? <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground"><Clock aria-hidden="true" className="h-2.5 w-2.5" />به‌زودی</span> : null}
            </>
          );
          return href && !soon ? <Link key={label} href={href} className="flex min-w-0 flex-col items-center py-1">{body}</Link> : <div key={label} aria-disabled="true" className="flex min-w-0 cursor-default flex-col items-center py-1">{body}</div>;
        })}
      </div>

      <div className="space-y-9 px-4 pt-8">
        <section aria-labelledby="night-title">
          <SectionHead icon={CalendarDays} title="روزشمار تجمعات شبانه" hint="برنامه و محور محتوایی شب‌های تجمع" action={<PillLink href="/content/report-days">تمام {new Intl.NumberFormat("fa-IR").format(todayNight)} شب</PillLink>} />
          <ReportDayCards days={reportDays.slice(0, 6)} compact />
        </section>

        <section aria-labelledby="speech-title">
          <SectionHead icon={BookOpen} title="کلام و یادداشت" hint="فیش‌های کوتاه و آماده استفاده برای منبر" action={<PillLink href="/content/speeches">مشاهده بیشتر</PillLink>} />
          <SpeechRows items={speeches.slice(0, 5)} />
        </section>

        <section aria-labelledby="music-video-title">
          <SectionHead icon={AudioLines} title="برگزیدهٔ نواها" hint="صوت‌های منتخب این هفته" action={<PillLink href="/content/music-videos">مشاهده بیشتر</PillLink>} />
          <MusicVideoStrip items={musicVideos.slice(0, 10)} />
        </section>
      </div>
    </div>
  );
}
