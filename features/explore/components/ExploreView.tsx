"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Hash,
  MapPin,
  Mic2,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "place" | "speaker" | "content" | "profile" | "topic";
  href: Route;
  keywords: string[];
  verified?: boolean;
};

const catalog: ExploreItem[] = [
  {
    id: "enghelab-square",
    title: "میدان انقلاب تهران",
    subtitle: "تهران · میدان و روایت‌های مرتبط",
    kind: "place",
    href: "/map",
    keywords: ["تهران", "انقلاب", "میدان", "تجمع"],
  },
  {
    id: "amir-chakhmaq",
    title: "میدان امیرچخماق یزد",
    subtitle: "یزد · میدان و رویدادهای محلی",
    kind: "place",
    href: "/map",
    keywords: ["یزد", "امیرچخماق", "میدان"],
  },
  {
    id: "panahian",
    title: "حجت‌الاسلام علیرضا پناهیان",
    subtitle: "سخنران · فیش‌ها و محتوای منتشرشده",
    kind: "speaker",
    href: "/speakers",
    keywords: ["پناهیان", "سخنران", "منبر", "نهج البلاغه"],
    verified: true,
  },
  {
    id: "meysam-motiee",
    title: "حاج میثم مطیعی",
    subtitle: "مداح و تولیدکننده محتوای آیینی",
    kind: "speaker",
    href: "/content/farmandeh-song",
    keywords: ["میثم", "مطیعی", "سرود", "صوت", "مداح"],
    verified: true,
  },
  {
    id: "nahj-jihad",
    title: "شرح نهج‌البلاغه؛ جهاد اجتماعی و سیاسی",
    subtitle: "بسته محتوایی · متن، پوستر و نسخه انتشار",
    kind: "content",
    href: "/content/nahj-jihad",
    keywords: ["نهج البلاغه", "جهاد", "منبر", "محتوا"],
  },
  {
    id: "farmandeh-song",
    title: "دم هماهنگ: «فرمانده کل قوا»",
    subtitle: "صوت منتخب · با نوای حاج میثم مطیعی",
    kind: "content",
    href: "/content/farmandeh-song",
    keywords: ["فرمانده", "سرود", "صوت", "مطیعی"],
  },
  {
    id: "profile",
    title: "هویت و پایگاه",
    subtitle: "پروفایل، فعالیت‌ها و اطلاعات پایگاه",
    kind: "profile",
    href: "/profile",
    keywords: ["پروفایل", "هویت", "پایگاه"],
  },
  {
    id: "street-square",
    title: "#میدان_خیابان",
    subtitle: "موضوع · روایت‌ها و محتوای مرتبط",
    kind: "topic",
    href: "/home",
    keywords: ["میدان خیابان", "هشتگ", "روایت"],
  },
];

const trends = [
  { id: "trend-1", label: "#میدان_خیابان", meta: "موضوع داغ در روایت‌ها", href: "/home" as Route },
  { id: "trend-2", label: "روایت میدان انقلاب", meta: "محتوا و گزارش‌های تازه", href: "/content" as Route },
  { id: "trend-3", label: "سخنرانان امشب", meta: "پیشنهادهای مرتبط با برنامه‌ها", href: "/speakers" as Route },
];

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/\s+/g, " ");
}

function ResultIcon({ kind }: { kind: ExploreItem["kind"] }) {
  const common = "h-5 w-5";
  if (kind === "place") return <MapPin className={common} />;
  if (kind === "speaker") return <Mic2 className={common} />;
  if (kind === "content") return <FileText className={common} />;
  if (kind === "profile") return <UserRound className={common} />;
  return <Hash className={common} />;
}

export function ExploreView() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const results = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return [];

    return catalog.filter((item) => {
      const haystack = normalize([item.title, item.subtitle, ...item.keywords].join(" "));
      return haystack.includes(needle);
    });
  }, [query]);

  const hasQuery = query.trim().length > 0;

  return (
    <section className="min-h-full bg-background text-foreground" aria-label="کاوش و جستجو">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-glass backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link href="/home" aria-label="بازگشت" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-hover">
            <ArrowRight className="h-5 w-5" />
          </Link>

          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-pill border border-input-border bg-input px-4 text-icon-muted transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4.5 w-4.5 shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="جستجو در میدان"
              aria-label="جستجو در میدان"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
            />
            {query ? (
              <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="پاک کردن جستجو" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-icon transition-colors hover:bg-hover">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>
      </header>

      {hasQuery ? (
        <div>
          <div className="border-b border-divider px-4 py-3">
            <p className="text-xs font-bold text-muted-foreground">نتایج برای «{query.trim()}»</p>
          </div>

          {results.length ? (
            <div className="divide-y divide-divider">
              {results.map((item) => (
                <Link key={item.id} href={item.href} className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-icon">
                    <ResultIcon kind={item.kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <strong className="truncate text-sm text-foreground">{item.title}</strong>
                      {item.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" aria-label="تأییدشده" /> : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-icon-muted" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-icon-muted"><Search className="h-6 w-6" /></span>
              <h1 className="mt-4 text-base font-black text-foreground">چیزی پیدا نشد</h1>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">نام میدان، شهر، سخنران، محتوا یا موضوع دیگری را امتحان کنید.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <section className="border-b border-divider px-4 py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-black text-foreground">کاوش</h1>
              <span className="text-[11px] font-bold text-muted-foreground">پیشنهاد برای شما</span>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {catalog.slice(0, 5).map((item) => (
                <button key={item.id} type="button" onClick={() => { setQuery(item.title.replace(/^#/, "")); inputRef.current?.focus(); }} className="shrink-0 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-hover">
                  {item.title}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 px-4 pb-2 pt-5">
              <TrendingUp className="h-5 w-5 text-brand" />
              <h2 className="text-base font-black text-foreground">موضوعات داغ</h2>
            </div>
            <div className="divide-y divide-divider">
              {trends.map((trend, index) => (
                <Link key={trend.id} href={trend.href} className="block px-4 py-4 transition-colors hover:bg-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-muted-foreground">{index + 1} · در حال رشد</span>
                      <h3 className="mt-1 truncate text-sm font-black text-foreground">{trend.label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{trend.meta}</p>
                    </div>
                    <ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-icon-muted" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}
