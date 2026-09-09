"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  FileText,
  Info,
  Mic,
  Music2,
  PhoneCall,
  Play,
  Printer,
  ShieldAlert,
  X,
} from "lucide-react";
import { generatedMedia } from "@/components/shared/generated-media";
import type { ContentItem, ContentQuickAction, ScheduleItem } from "../types";

const actionIcons = {
  speakers: Mic,
  contact: PhoneCall,
  print: Printer,
  safety: ShieldAlert,
};

const actionStyles = {
  speakers: "border-warning-border bg-warning-surface text-warning",
  contact: "border-success-border bg-success-surface text-success",
  print: "border-info-border bg-info-surface text-info",
  safety: "border-danger-border bg-danger-surface text-danger",
};

type DetailModal = { title: string; description: string } | null;

export function ContentView({ scheduleItems, quickActions }: { items: ContentItem[]; scheduleItems: ScheduleItem[]; quickActions: ContentQuickAction[] }) {
  const [detailModal, setDetailModal] = useState<DetailModal>(null);
  const [audioNotice, setAudioNotice] = useState(false);

  const openQuickAction = (action: ContentQuickAction) => {
    const descriptions: Partial<Record<ContentQuickAction["id"], string>> = {
      speakers: "درخواست و پیگیری اعزام سخنران به میدان.",
      contact: "راه‌های ارتباط با ستاد مرکزی قرارگاه میدانِ خیابان.",
      print: "فایل‌های لایه‌باز آماده چاپ افست و سیلک.",
      safety: "دستورالعمل پدافند غیرعامل و اقدامات احتیاطی.",
    };
    setDetailModal({ title: action.label, description: descriptions[action.id] ?? action.detail });
  };

  return (
    <section id="view-content" className="min-h-full space-y-6 bg-background p-4 pb-24 text-foreground">
      <Link href="/content/nahj-jihad" className="relative block cursor-pointer overflow-hidden rounded-2xl border border-border bg-solid-dark shadow-card">
        <div className="relative h-52 w-full">
          <img src={generatedMedia.contentHero} alt="محتوا" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-solid-dark via-solid-dark/55 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 space-y-1 text-right">
            <span className="mb-1 inline-block rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">منبر شبانه</span>
            <h2 className="text-base font-black leading-tight text-on-solid">شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی</h2>
            <p className="line-clamp-2 text-xs leading-relaxed text-on-solid/75">شرح خطبه جهاد متناسب با روحیه ایستادگی و حضور سازمان‌یافته مردمی.</p>
          </div>
        </div>
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          {quickActions.map((action) => {
            const Icon = actionIcons[action.icon];
            const body = (
              <>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${actionStyles[action.icon]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-foreground-secondary">{action.label}</span>
              </>
            );

            if (action.href) {
              return (
                <Link key={action.id} href={action.href as Route} className="flex flex-col items-center gap-1.5 rounded-2xl p-1 transition-colors hover:bg-hover">
                  {body}
                </Link>
              );
            }

            return (
              <button key={action.id} type="button" onClick={() => openQuickAction(action)} className="flex flex-col items-center gap-1.5 rounded-2xl p-1 transition-colors hover:bg-hover">
                {body}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-foreground"><Calendar className="h-4 w-4 text-brand" />روزشمار تجمعات شبانه</h3>
          <span className="text-[11px] font-bold text-brand">تمام ۴۰ شب</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {scheduleItems.map((item, index) => {
            const base = "relative flex h-28 w-36 shrink-0 cursor-pointer flex-col justify-between rounded-xl border p-3 text-right";
            const classes = item.current
              ? `${base} border-brand-border bg-brand text-brand-foreground shadow-xs`
              : index === 0
                ? `${base} border-danger-border bg-solid-dark text-on-solid`
                : `${base} border-border bg-surface text-foreground`;
            return (
              <button key={item.id} type="button" onClick={() => setDetailModal({ title: `${item.night}: ${item.title}`, description: item.description })} className={classes}>
                <span className={`text-[10px] ${item.current ? "rounded bg-on-solid/20 px-1.5 py-0.5 font-bold" : "text-foreground-subtle"}`}>{item.night}</span>
                <span className="absolute -top-1 left-2 font-mono text-3xl font-black opacity-15">{item.number}</span>
                <div><div className="text-xs font-bold">{item.title}</div><div className="text-[10px] opacity-70">{item.description}</div></div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-foreground"><BookOpen className="h-4 w-4 text-warning" />سخنرانی‌های مکتوب</h3>
          <span className="text-[11px] text-muted-foreground">فیش ۱۰ دقیقه‌ای منبر</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src={generatedMedia.avatarSpeaker} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div className="min-w-0"><h4 className="text-xs font-bold text-foreground">حجت‌الاسلام علیرضا پناهیان</h4><p className="mt-0.5 text-[10px] text-muted-foreground">مفهوم «میدانِ خیابان» در دفاع اجتماعی</p></div>
            </div>
            <Link href="/content/panahian-square" className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-muted px-2.5 py-1.5 text-[11px] font-bold text-foreground-secondary transition-colors hover:bg-brand hover:text-brand-foreground"><FileText className="h-3 w-3" />دریافت فیش</Link>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src={generatedMedia.avatarCoordinator} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div className="min-w-0"><h4 className="text-xs font-bold text-foreground">استاد ناصر رفیعی</h4><p className="mt-0.5 text-[10px] text-muted-foreground">سیره اهل‌بیت در مواجهه با محاصره و بحران</p></div>
            </div>
            <Link href="/content/rafiei-crisis" className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-muted px-2.5 py-1.5 text-[11px] font-bold text-foreground-secondary transition-colors hover:bg-brand hover:text-brand-foreground"><FileText className="h-3 w-3" />دریافت فیش</Link>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-foreground"><Music2 className="h-4 w-4 text-success" />دم‌ها و سرودهای حماسی کشوری</h3>
          <Link href="/podcasts" className="flex items-center gap-0.5 text-[11px] font-bold text-brand hover:underline"><span>مشاهده بیشتر</span><ChevronLeft className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <Link href="/content/farmandeh-song" aria-label="مشاهده جزئیات دم هماهنگ فرمانده کل قوا" className="p-2 text-icon-muted transition-colors hover:text-icon"><Info className="h-5 w-5" /></Link>
          <Link href="/content/farmandeh-song" className="flex-1 cursor-pointer pr-3 text-right"><h4 className="text-sm font-bold text-foreground">دم هماهنگ: «فرمانده کل قوا»</h4><p className="mt-0.5 text-[11px] text-muted-foreground">با نوای حاج میثم مطیعی · ۳ دقیقه</p></Link>
          <button type="button" onClick={() => { setAudioNotice(true); window.setTimeout(() => setAudioNotice(false), 2200); }} aria-label="پخش فرمانده کل قوا" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xs"><Play className="mr-0.5 h-5 w-5 fill-current" /></button>
        </div>
      </div>

      {detailModal ? (
        <div role="dialog" aria-modal="true" aria-label={detailModal.title} className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center">
          <section className="w-full max-w-sm rounded-panel border border-border bg-popover p-5 text-popover-foreground shadow-dialog">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-black">{detailModal.title}</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">{detailModal.description}</p></div><button type="button" onClick={() => setDetailModal(null)} aria-label="بستن" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-icon-muted hover:bg-hover hover:text-icon"><X className="h-4 w-4" /></button></div>
          </section>
        </div>
      ) : null}

      {audioNotice ? <div role="status" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-pill bg-solid-dark px-4 py-2 text-xs font-bold text-on-solid shadow-floating">پخش صوت آماده است</div> : null}
    </section>
  );
}
