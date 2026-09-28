import Link from "next/link";
import type { Route } from "next";
import { BookOpen, ChevronLeft, FileText, HandHeart, Headphones, Mic, PhoneCall, Printer } from "lucide-react";
import { generatedMedia } from "@/components/shared/generated-media";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import type { ContentItem, ContentPoster } from "../types";
import { MusicVideoStrip } from "./MusicVideoCards";
import type { ReportDay } from "../services/report-days.service";
import { ReportDayCards, ReportDaysHeading } from "./ReportDayCards";

const actions: Array<{ label: string; href?: string; icon: typeof Mic; color: string }> = [
  { label: "اعزام سخنران", href: "/speakers", icon: Mic, color: "bg-amber-50 text-amber-700" },
  { label: "ارتباط با ما", icon: PhoneCall, color: "bg-emerald-50 text-emerald-700" },
  { label: "چاپ پلاکارد", icon: Printer, color: "bg-blue-50 text-blue-700" },
  { label: "همیاری", icon: HandHeart, color: "bg-red-50 text-red-700" },
];

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

export function ContentView({ poster, speeches, musicVideos, reportDays, todayNight }: { poster: ContentPoster; speeches: ContentItem[]; musicVideos: ContentItem[]; reportDays: ReportDay[]; todayNight: number }) {
  const posterImage = poster.imageUrl || generatedMedia.contentHero;
  const posterBody = <img src={posterImage} alt="پوستر صفحه محتوا" className="h-full w-full object-cover" />;
  return (
    <main id="view-content" className="min-h-full bg-background pb-24 text-foreground" dir="rtl">
      <div className="px-3 pt-3 sm:px-4">
        {poster.href ? <a href={poster.href} className="block h-[260px] overflow-hidden rounded-[20px] border border-border bg-surface sm:h-[320px]" aria-label="مشاهده پوستر">{posterBody}</a> : <div className="h-[260px] overflow-hidden rounded-[20px] border border-border bg-surface sm:h-[320px]">{posterBody}</div>}
      </div>

      <div className="mt-4 grid grid-cols-4 border-y border-divider bg-surface px-1 py-2.5" aria-label="خدمات محتوا">
        {actions.map(({ label, href, icon: Icon, color }) => { const body = <><span className={`grid h-10 w-10 place-items-center rounded-full ${color}`}><Icon className="h-[18px] w-[18px]" /></span><span className="mt-1.5 truncate text-[10px] font-bold">{label}</span></>; return href ? <Link key={label} href={href as Route} className="flex min-w-0 flex-col items-center border-l border-divider px-1 py-1.5 last:border-l-0">{body}</Link> : <div key={label} className="flex min-w-0 flex-col items-center border-l border-divider px-1 py-1.5 last:border-l-0">{body}</div>; })}
      </div>

      <div className="space-y-8 px-3 pt-6 sm:px-4">
        <section aria-labelledby="night-title">
          <Link href={"/content/report-days" as Route} className="block"><ReportDaysHeading todayNight={todayNight} /></Link>
          <div className="mt-4"><ReportDayCards days={reportDays.slice(0, 5)} compact /></div>
        </section>

        <section aria-labelledby="speech-title">
          <div className="mb-3 flex items-center justify-between gap-2"><div><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-amber-700"><BookOpen className="h-4 w-4" /></span><h2 id="speech-title" className="text-sm font-black">سخنرانی‌ها و یادداشت‌ها</h2></div><p className="mt-1 pr-9 text-[10px] text-muted-foreground">فیش‌های کوتاه و آماده استفاده برای منبر</p></div><Link href={"/content/speeches" as Route} className="inline-flex shrink-0 items-center text-[11px] font-bold text-brand hover:underline">مشاهده بیشتر <ChevronLeft className="h-3.5 w-3.5" /></Link></div>
          <SpeechRows items={speeches.slice(0, 5)} />
        </section>

        <section aria-labelledby="music-video-title">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-muted text-brand"><Headphones className="h-4 w-4" /></span>
                <h2 id="music-video-title" className="text-sm font-black">آوا و نوا</h2>
              </div>
              <p className="mt-1 pr-9 text-[10px] text-muted-foreground">تازه‌ترین آثار</p>
            </div>
            <Link href={"/content/music-videos" as Route} className="inline-flex shrink-0 items-center text-[11px] font-bold text-brand hover:underline">مشاهده بیشتر <ChevronLeft className="h-3.5 w-3.5" /></Link>
          </div>
          <MusicVideoStrip items={musicVideos.slice(0, 10)} />
        </section>
      </div>
    </main>
  );
}
