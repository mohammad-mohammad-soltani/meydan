"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
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
import { meydanClientApi } from "@/lib/meydan-client-api";

type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "place" | "speaker" | "content" | "profile" | "topic";
  href: string;
  keywords: string[];
  verified?: boolean;
};

type ApiActor = { id: string; display_name: string; verified?: boolean };
type ApiSquare = { id: number; name: string; description?: string; verified?: boolean; location?: { address?: string } | null };
type ApiContent = { id: number; title: string; excerpt?: string };
type ApiCreator = { id: number; name: string; role?: string; verified?: boolean };
type ApiTopic = { id: number; name: string; slug: string };
type ApiNarrative = { id: number; body?: string; author?: ApiActor };
type SearchResponse = {
  sections: {
    narratives?: ApiNarrative[];
    squares?: ApiSquare[];
    users?: ApiActor[];
    content?: ApiContent[];
    creators?: ApiCreator[];
    topics?: ApiTopic[];
  };
};
type SuggestionsResponse = {
  nearby_squares?: ApiSquare[];
  creators?: ApiCreator[];
  content?: ApiContent[];
  topics?: ApiTopic[];
  recommended_actors?: ApiActor[];
};
type TrendsResponse = { items?: ApiNarrative[] };

type TrendItem = { id: string; label: string; meta: string; href: Route };

function toItems(response: SearchResponse): ExploreItem[] {
  const s = response.sections || {};
  return [
    ...(s.squares || []).map((item): ExploreItem => ({ id: `square-${item.id}`, title: item.name, subtitle: item.location?.address || item.description || "پایگاه میدان", kind: "place", href: "/map", keywords: [], verified: item.verified })),
    ...(s.creators || []).map((item): ExploreItem => ({ id: `creator-${item.id}`, title: item.name, subtitle: item.role || "سخنران و تولیدکننده محتوا", kind: "speaker", href: "/speakers", keywords: [], verified: item.verified })),
    ...(s.content || []).map((item): ExploreItem => ({ id: `content-${item.id}`, title: item.title, subtitle: item.excerpt || "محتوای میدان", kind: "content", href: `/content/${item.id}`, keywords: [] })),
    ...(s.users || []).map((item): ExploreItem => ({ id: `user-${item.id}`, title: item.display_name, subtitle: "کاربر میدان", kind: "profile", href: "/home", keywords: [], verified: item.verified })),
    ...(s.topics || []).map((item): ExploreItem => ({ id: `topic-${item.id}`, title: `#${item.name}`, subtitle: "موضوع · روایت‌های مرتبط", kind: "topic", href: "/home", keywords: [item.slug] })),
    ...(s.narratives || []).map((item): ExploreItem => ({ id: `narrative-${item.id}`, title: item.author?.display_name || "روایت میدان", subtitle: (item.body || "").replace(/<[^>]+>/g, "").slice(0, 90), kind: "content", href: `/posts/${item.id}`, keywords: [] })),
  ];
}

function suggestionItems(response: SuggestionsResponse): ExploreItem[] {
  return [
    ...(response.nearby_squares || []).map((item): ExploreItem => ({ id: `suggest-square-${item.id}`, title: item.name, subtitle: item.location?.address || "پایگاه میدان", kind: "place", href: "/map", keywords: [], verified: item.verified })),
    ...(response.creators || []).map((item): ExploreItem => ({ id: `suggest-creator-${item.id}`, title: item.name, subtitle: item.role || "سخنران", kind: "speaker", href: "/speakers", keywords: [], verified: item.verified })),
    ...(response.content || []).map((item): ExploreItem => ({ id: `suggest-content-${item.id}`, title: item.title, subtitle: item.excerpt || "محتوای منتخب", kind: "content", href: `/content/${item.id}`, keywords: [] })),
    ...(response.topics || []).map((item): ExploreItem => ({ id: `suggest-topic-${item.id}`, title: `#${item.name}`, subtitle: "موضوع پیشنهادی", kind: "topic", href: "/home", keywords: [item.slug] })),
  ].slice(0, 8);
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
  const [results, setResults] = useState<ExploreItem[]>([]);
  const [catalog, setCatalog] = useState<ExploreItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    void Promise.all([
      meydanClientApi<SuggestionsResponse>("/explore/suggestions"),
      meydanClientApi<TrendsResponse>("/explore/trends?window=24h"),
    ]).then(([suggestions, trending]) => {
      setCatalog(suggestionItems(suggestions));
      setTrends((trending.items || []).slice(0, 6).map((item) => ({ id: `trend-${item.id}`, label: item.author?.display_name || "روایت میدان", meta: (item.body || "").replace(/<[^>]+>/g, "").slice(0, 80) || "روایت در حال رشد", href: `/posts/${item.id}` as Route })));
    }).catch(() => undefined);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) { setResults([]); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      void meydanClientApi<SearchResponse>(`/explore/search?q=${encodeURIComponent(needle)}`)
        .then((data) => { if (active) setResults(toItems(data)); })
        .catch(() => { if (active) setResults([]); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
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
                <Link key={item.id} href={item.href as Route} className="flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-icon"><ResultIcon kind={item.kind} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5"><strong className="truncate text-sm text-foreground">{item.title}</strong>{item.verified ? <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" aria-label="تأییدشده" /> : null}</span>
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
            <div className="flex items-center justify-between"><h1 className="text-lg font-black text-foreground">کاوش</h1><span className="text-[11px] font-bold text-muted-foreground">پیشنهاد برای شما</span></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {catalog.slice(0, 5).map((item) => <button key={item.id} type="button" onClick={() => { setQuery(item.title.replace(/^#/, "")); inputRef.current?.focus(); }} className="shrink-0 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-hover">{item.title}</button>)}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 px-4 pb-2 pt-5"><TrendingUp className="h-5 w-5 text-brand" /><h2 className="text-base font-black text-foreground">موضوعات داغ</h2></div>
            <div className="divide-y divide-divider">
              {trends.map((trend, index) => (
                <Link key={trend.id} href={trend.href} className="block px-4 py-4 transition-colors hover:bg-hover">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[11px] text-muted-foreground">{index + 1} · در حال رشد</span><h3 className="mt-1 truncate text-sm font-black text-foreground">{trend.label}</h3><p className="mt-1 text-xs text-muted-foreground">{trend.meta}</p></div><ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-icon-muted" /></div>
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
