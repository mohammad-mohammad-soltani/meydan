import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ChevronLeft, Mic, Phone, PhoneCall, Send } from "lucide-react";
import "../reference-content.css";
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
    <div className="reference-speech-list flex flex-col" dir="rtl">
      {items.map((item) => (
        <Link key={item.apiId} href={`/content/${item.apiId}` as Route} className="reference-speech-row flex items-center gap-3 border-b border-[var(--m-line)] px-1 py-3.5 transition-colors last:border-0 hover:bg-hover">
          <span className="grid h-[46px] w-[46px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-muted text-base font-extrabold">
            {item.authorAvatar ? <OptimizedAvatar src={item.authorAvatar} alt="" width={46} className="h-full w-full object-cover" /> : (item.author || item.title).slice(0, 1)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="block line-clamp-2 text-sm font-extrabold leading-[1.7] text-foreground">{item.title}</strong>
            <small className="block truncate text-[11.5px] leading-[17px] text-muted-foreground">{item.author || item.title}</small>
          </span>
          <span className="inline-flex shrink-0 items-center gap-[5px] rounded-full border border-border px-3 py-1.5 text-[11.5px] font-bold leading-[17px] text-muted-foreground">{DOC_ICON}فیش</span>
        </Link>
      ))}
    </div>
  );
}

const ACTIONS: Array<{ label: string; icon: typeof Mic; tone: string; href?: Route; soon?: boolean }> = [
  { label: "اعزام سخنران", icon: Mic, tone: "bg-[#7c5cff]", href: "/speakers" as Route },
  { label: "پویش", icon: Send, tone: "bg-[#22c55e]", href: "/home?filter=initiatives" as Route },
  { label: "بیست‌کال", icon: PhoneCall, tone: "bg-[#0ea5e9]", soon: true },
  { label: "ارتباط با ما", icon: Phone, tone: "bg-[#ec4899]", soon: true },
];

/** The reference's own section glyphs: 18px, 1.9 stroke. */
const SectionIcon = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const CALENDAR_ICON = <SectionIcon><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></SectionIcon>;
const NOTES_ICON = <SectionIcon><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M9 8h6" /></SectionIcon>;
const WAVE_ICON = <SectionIcon><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" /></SectionIcon>;
const DOC_ICON = <SectionIcon size={14}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></SectionIcon>;

function SectionHead({ icon, title, hint, action }: { icon: ReactNode; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="reference-content-heading flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-foreground">{icon}</span>
      <div className="min-w-0 flex-1"><h2 className="text-base font-black leading-6 text-foreground">{title}</h2><p className="text-[11.5px] leading-[17px] text-muted-foreground">{hint}</p></div>
      {action}
    </div>
  );
}

/** The reference's two header actions: a bordered pill with the count, and the plain muted «مشاهده بیشتر». */
function PillLink({ href, children, plain = false }: { href: string; children: ReactNode; plain?: boolean }) {
  return plain
    ? <Link href={href as Route} className="inline-flex shrink-0 items-center gap-0.5 px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">{children}<ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" /></Link>
    : <Link href={href as Route} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--rail-card-border)] bg-surface-muted px-[13px] py-[7px] text-[11.5px] font-bold text-foreground transition-colors hover:bg-hover">{children}<ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" /></Link>;
}

/** «پیشخوان»: banners, quick actions, the nights counter, short talks and the picked audio. */
export function ContentView({ banners, speeches, musicVideos, reportDays }: { banners: ContentBanner[]; speeches: ContentItem[]; musicVideos: ContentItem[]; reportDays: ReportDay[]; todayNight: number }) {
  return (
    <div className="reference-content text-foreground" dir="rtl">
      <HubBanners banners={banners} />

      <div className="reference-content-actions grid grid-cols-4 gap-2 px-3.5" aria-label="خدمات محتوا">
        {ACTIONS.map(({ label, icon: Icon, tone, href, soon }) => {
          const body = (
            <>
              <span className={`relative grid h-[62px] w-[62px] place-items-center rounded-full text-white ${tone}`}><Icon aria-hidden="true" className="h-[22px] w-[22px]" /></span>
              <span className="mt-[9px] truncate text-[11.5px] font-bold">{label}</span>
            </>
          );
          return href && !soon ? <Link key={label} href={href} className="flex min-w-0 flex-col items-center py-1">{body}</Link> : <div key={label} aria-disabled="true" className="flex min-w-0 cursor-default flex-col items-center py-1">{body}</div>;
        })}
      </div>

      <div className="reference-content-sections">
        <section aria-labelledby="night-title">
          <SectionHead icon={CALENDAR_ICON} title="روزشمار تجمعات شبانه" hint="برنامه و محور محتوایی شب‌های تجمع" action={<PillLink href="/content/report-days">تمام {new Intl.NumberFormat("fa-IR").format(reportDays.length)} شب</PillLink>} />
          <ReportDayCards days={reportDays.slice(0, 6)} compact />
        </section>

        <section aria-labelledby="speech-title">
          <SectionHead icon={NOTES_ICON} title="کلام و یادداشت" hint="فیش‌های کوتاه و آماده استفاده برای منبر" action={<PillLink plain href="/content/speeches">مشاهده بیشتر</PillLink>} />
          <SpeechRows items={speeches.slice(0, 6)} />
        </section>

        <section aria-labelledby="music-video-title">
          <SectionHead icon={WAVE_ICON} title="برگزیدهٔ نواها" hint="صوت‌های منتخب این هفته" action={<PillLink plain href="/content/music-videos">مشاهده بیشتر</PillLink>} />
          <MusicVideoStrip items={musicVideos.slice(0, 10)} />
        </section>
      </div>
    </div>
  );
}
