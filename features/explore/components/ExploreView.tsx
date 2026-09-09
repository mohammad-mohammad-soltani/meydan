"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  FileText,
  Hash,
  LoaderCircle,
  MapPin,
  Mic2,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

type ExploreKind = "place" | "speaker" | "content" | "profile" | "topic" | "narrative";
type ExploreItem = { id: string; title: string; subtitle: string; kind: ExploreKind; href: Route; verified?: boolean };
type TrendItem = { id: string; label: string; meta: string; href: Route };

type ApiSearch = {
  sections?: {
    narratives?: Array<any>;
    squares?: Array<any>;
    users?: Array<any>;
    content?: Array<any>;
    creators?: Array<any>;
    topics?: Array<any>;
  };
};

type ApiInitial = {
  suggestions?: {
    nearby_squares?: Array<any>;
    creators?: Array<any>;
    topics?: Array<any>;
    content?: Array<any>;
    recommended_actors?: Array<any>;
  };
  trends?: { items?: Array<any> };
};

function resultIcon(kind: ExploreKind) {
  const common = "h-5 w-5";
  if (kind === "place") return <MapPin className={common} />;
  if (kind === "speaker") return <Mic2 className={common} />;
  if (kind === "content" || kind === "narrative") return <FileText className={common} />;
  if (kind === "profile") return <UserRound className={common} />;
  return <Hash className={common} />;
}

function mapSearch(data: ApiSearch): ExploreItem[] {
  const s = data.sections || {};
  const items: ExploreItem[] = [];
  for (const square of s.squares || []) items.push({ id: `square-${square.id}`, title: square.name || "میدان", subtitle: square.location?.address || "میدان و روایت‌های مرتبط", kind: "place", href: "/map" as Route, verified: Boolean(square.verified) });
  for (const creator of s.creators || []) items.push({ id: `creator-${creator.id}`, title: creator.name || "تولیدکننده", subtitle: creator.role || "محتوا و آثار منتشرشده", kind: "speaker", href: "/speakers" as Route, verified: Boolean(creator.verified) });
  for (const content of s.content || []) items.push({ id: `content-${content.id}`, title: content.title || "محتوا", subtitle: content.excerpt || content.category?.name || "محتوای میدان", kind: "content", href: (`/content/${content.id}`) as Route });
  for (const narrative of s.narratives || []) items.push({ id: `narrative-${narrative.id}`, title: narrative.author?.display_name || "روایت میدان", subtitle: String(narrative.body || "").replace(/<[^>]+>/g, "").slice(0, 90), kind: "narrative", href: (`/posts/${narrative.id}`) as Route });
  for (const user of s.users || []) items.push({ id: `user-${user.id}`, title: user.display_name || "کاربر", subtitle: user.headline || "هویت و فعالیت‌ها", kind: "profile", href: "/profile" as Route, verified: Boolean(user.verified) });
  for (const topic of s.topics || []) items.push({ id: `topic-${topic.id}`, title: `#${topic.name || topic.slug}`, subtitle: "موضوع · روایت‌ها و محتوای مرتبط", kind: "topic", href: "/home" as Route });
  return items;
}

function mapSuggestions(data: ApiInitial): ExploreItem[] {
  const s = data.suggestions || {};
  return [
    ...(s.nearby_squares || []).slice(0, 2).map((x) => ({ id: `sq-${x.id}`, title: x.name, subtitle: x.location?.address || "میدان نزدیک", kind: "place" as const, href: "/map" as Route, verified: Boolean(x.verified) })),
    ...(s.creators || []).slice(0, 2).map((x) => ({ id: `cr-${x.id}`, title: x.name, subtitle: x.role || "تولیدکننده", kind: "speaker" as const, href: "/speakers" as Route, verified: Boolean(x.verified) })),
    ...(s.content || []).slice(0, 2).map((x) => ({ id: `ct-${x.id}`, title: x.title, subtitle: x.excerpt || "محتوای پیشنهادی", kind: "content" as const, href: (`/content/${x.id}`) as Route })),
    ...(s.topics || []).slice(0, 2).map((x) => ({ id: `tp-${x.id}`, title: `#${x.name}`, subtitle: "موضوع پیشنهادی", kind: "topic" as const, href: "/home" as Route })),
  ].slice(0, 6);
}

function mapTrends(data: ApiInitial): TrendItem[] {
  return (data.trends?.items || []).slice(0, 5).map((item, index) => ({
    id: `trend-${item.id}`,
    label: item.author?.display_name ? `روایت ${item.author.display_name}` : `روایت داغ ${index + 1}`,
    meta: String(item.body || "").replace(/<[^>]+>/g, "").slice(0, 80) || "در حال رشد در میدان",
    href: (`/posts/${item.id}`) as Route,
  }));
}

export function ExploreView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExploreItem[]>([]);
  const [suggestions, setSuggestions] = useState<ExploreItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/meydan/explore")
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json())?.error?.message || "خطا در دریافت داده");
        return response.json();
      })
      .then((body) => {
        setSuggestions(mapSuggestions(body.data || {}));
        setTrends(mapTrends(body.data || {}));
        setError("");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "خطا در ارتباط با میدان"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/meydan/explore?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error((await response.json())?.error?.message || "خطا در جستجو");
          return response.json();
        })
        .then((body) => {
          setResults(mapSearch(body.data || {}));
          setError("");
        })
        .catch((reason) => {
          if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "خطا در جستجو");
        })
        .finally(() => setIsLoading(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const shownSuggestions = useMemo(() => suggestions.slice(0, 5), [suggestions]);

  return (
    <section className="min-h-full bg-background text-foreground" aria-label="کاوش و جستجو">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-glass backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link href="/home" aria-label="بازگشت" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-hover">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-pill border border-input-border bg-input px-4 text-icon-muted transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4.5 w-4.5 shrink-0" />
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} type="search" inputMode="search" autoComplete="off" placeholder="جستجو در میدان" aria-label="جستجو در میدان" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder" />
            {query ? <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="پاک کردن جستجو" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-icon transition-colors hover:bg-hover"><X className="h-4 w-4" /></button> : null}
          </label>
        </div>
      </header>

      {error ? <p className="mx-4 mt-4 rounded-xl border border-border bg-surface p-3 text-xs text-destructive">{error}</p> : null}

      {hasQuery ? (
        <div>
          <div className="border-b border-divider px-4 py-3"><p className="text-xs font-bold text-muted-foreground">نتایج برای «{query.trim()}»</p></div>
          {isLoading ? <div className="flex justify-center py-14 text-muted-foreground"><LoaderCircle className="h-6 w-6 animate-spin" /></div> : results.length ? (
            <div className="divide-y divide-divider">
              {results.map((item) => (
                <Link key={item.id} href={item.href} className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-icon">{resultIcon(item.kind)}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><strong className="truncate text-sm text-foreground">{item.title}</strong>{item.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" aria-label="تأییدشده" /> : null}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.subtitle}</span></span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-icon-muted" />
                </Link>
              ))}
            </div>
          ) : <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-icon-muted"><Search className="h-6 w-6" /></span><h1 className="mt-4 text-base font-black text-foreground">چیزی پیدا نشد</h1><p className="mt-2 text-xs leading-6 text-muted-foreground">نام میدان، شهر، سخنران، محتوا یا موضوع دیگری را امتحان کنید.</p></div>}
        </div>
      ) : (
        <div>
          <section className="border-b border-divider px-4 py-5">
            <div className="flex items-center justify-between"><h1 className="text-lg font-black text-foreground">کاوش</h1><span className="text-[11px] font-bold text-muted-foreground">پیشنهاد برای شما</span></div>
            {isLoading && !shownSuggestions.length ? <div className="mt-4 flex justify-center text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /></div> : <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{shownSuggestions.map((item) => <button key={item.id} type="button" onClick={() => { setQuery(item.title.replace(/^#/, "")); inputRef.current?.focus(); }} className="shrink-0 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-hover">{item.title}</button>)}</div>}
          </section>
          <section>
            <div className="flex items-center gap-2 px-4 pb-2 pt-5"><TrendingUp className="h-5 w-5 text-brand" /><h2 className="text-base font-black text-foreground">موضوعات داغ</h2></div>
            <div className="divide-y divide-divider">{trends.map((trend, index) => <Link key={trend.id} href={trend.href} className="block px-4 py-4 transition-colors hover:bg-hover"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[11px] text-muted-foreground">{index + 1} · در حال رشد</span><h3 className="mt-1 truncate text-sm font-black text-foreground">{trend.label}</h3><p className="mt-1 text-xs text-muted-foreground">{trend.meta}</p></div><ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-icon-muted" /></div></Link>)}</div>
          </section>
        </div>
      )}
    </section>
  );
}
