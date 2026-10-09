"use client";

import "../reference-explore.css";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Building2,
  ChevronLeft,
  FileText,
  Hash,
  MapPin,
  MessageSquareText,
  PenLine,
  Mic2,
  Newspaper,
  RefreshCw,
  Search,
  SearchX,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AccountBadges } from "@/components/shared/AccountBadges";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { searchExplore } from "../services/explore.service";
import { getExploreHome, type ExploreHome } from "../services/explore-home.service";
import { useFollowSet } from "../hooks/useFollowSet";
import { FeedSwipePager } from "@/features/feed/components/FeedSwipePager";
import { ExploreSections, type ExploreSection } from "./ExploreHomeSections";
import type {
  ExploreFilter,
  ExploreResult,
  ExploreResultKind,
} from "../types";

type ExploreTab = "all" | "narratives" | "squares" | "people";

const TABS: Array<{ id: ExploreTab; label: string }> = [
  { id: "all", label: "برای شما" },
  { id: "narratives", label: "روایت‌ها" },
  { id: "squares", label: "میدان‌ها" },
  { id: "people", label: "افراد" },
];

/** What each tab shows, in the reference's order. */
const TAB_SECTIONS: Record<ExploreTab, ExploreSection[]> = {
  all: ["tags", "suggestions", "hot", "active", "speakers"],
  narratives: ["tags", "hot"],
  squares: ["active", "suggestions"],
  people: ["people", "speakers"],
};

function HomeSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8 px-4 py-6">
      <div className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, index) => <span key={index} className="h-[68px] w-40 shrink-0 animate-pulse rounded-2xl bg-skeleton" />)}</div>
      <div className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, index) => <span key={index} className="h-[190px] w-[148px] shrink-0 animate-pulse rounded-3xl bg-skeleton" />)}</div>
      <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <span key={index} className="block h-20 animate-pulse rounded-2xl bg-skeleton" />)}</div>
    </div>
  );
}

const filters: Array<{
  id: ExploreFilter;
  label: string;
  icon: typeof Search;
}> = [
  { id: "all", label: "همه", icon: Search },
  { id: "narrative", label: "روایت‌ها", icon: MessageSquareText },
  { id: "square", label: "میدان‌ها", icon: MapPin },
  { id: "media", label: "رسانه‌ها", icon: Newspaper },
  { id: "collective", label: "مجموعه‌ها", icon: Users },
  { id: "organization", label: "سازمان‌ها", icon: Building2 },
  { id: "content", label: "محتوا", icon: FileText },
  { id: "creator", label: "سخنران‌ها", icon: Mic2 },
  { id: "user", label: "کاربران", icon: UserRound },
  { id: "topic", label: "موضوعات", icon: Hash },
];

const kindMeta: Record<
  ExploreResultKind,
  { label: string; icon: typeof Search }
> = {
  narrative: { label: "روایت", icon: MessageSquareText },
  square: { label: "میدان", icon: MapPin },
  media: { label: "رسانه", icon: Newspaper },
  collective: { label: "مجموعه", icon: Users },
  organization: { label: "سازمان", icon: Building2 },
  memorial: { label: "یادبود", icon: UserRound },
  creator: { label: "سخنران", icon: Mic2 },
  content: { label: "محتوا", icon: FileText },
  user: { label: "کاربر", icon: UserRound },
  topic: { label: "موضوع", icon: Hash },
};

function ResultAvatar({ item }: { item: ExploreResult }) {
  const Icon = kindMeta[item.kind].icon;

  if (item.avatarUrl) {
    return (
      <OptimizedAvatar
        src={item.avatarUrl}
        kind={item.kind}
        alt=""
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }

  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-icon-muted">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function SearchResultRow({ item }: { item: ExploreResult }) {
  return (
    <Link
      href={item.href as Route}
      className="group flex min-h-[76px] items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-hover focus-visible:bg-hover"
      dir="rtl"
    >
      <ResultAvatar item={item} />

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <strong className="truncate text-[13px] font-black text-foreground">
            {item.title}
          </strong>

          <AccountBadges verified={item.verified} speaker={item.speaker} official={item.official} kind={item.kind} size="md" />

          <span className="shrink-0 text-[10px] text-foreground-subtle">
            · {kindMeta[item.kind].label}
          </span>
        </span>

        <span className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
          {item.subtitle}
        </span>

        {item.meta && item.meta !== kindMeta[item.kind].label ? (
          <span className="mt-1 block truncate text-[10px] font-bold text-brand">
            {item.meta}
          </span>
        ) : null}
      </span>

      <ChevronLeft className="h-4 w-4 shrink-0 text-icon-muted transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="divide-y divide-divider" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex min-h-[76px] items-center gap-3 px-4 py-3">
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-skeleton" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-1/3 animate-pulse rounded-full bg-skeleton" />
            <span className="block h-2.5 w-4/5 animate-pulse rounded-full bg-skeleton" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ExploreView({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("all");
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [searchError, setSearchError] = useState("");
  const [tab, setTab] = useState<ExploreTab>("all");
  const [home, setHome] = useState<{ status: "loading" | "ready" | "error"; data: ExploreHome | null }>({ status: "loading", data: null });
  const [searchRetry, setSearchRetry] = useState(0);
  const [landingRetry, setLandingRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const hasQuery = query.trim().length > 0;
  // A search for exactly one hashtag invites the viewer to publish under it.
  const singleTag = /^#([\p{L}\p{N}_]{2,64})$/u.exec(query.trim())?.[1];

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setHome((current) => (current.data ? current : { status: "loading", data: null })); });

    void getExploreHome()
      .then((data) => { if (!cancelled) setHome({ status: "ready", data }); })
      .catch(() => { if (!cancelled) setHome({ status: "error", data: null }); });

    return () => {
      cancelled = true;
    };
  }, [landingRetry]);

  const followables = useMemo(
    () => (home.data ? [...home.data.entities, ...home.data.people, ...home.data.active] : []).map((entry) => ({ type: entry.type, id: entry.id })),
    [home.data],
  );
  const follow = useFollowSet(followables);

  useEffect(() => {
    const needle = query.trim();

    if (!needle) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setResults([]);
        setSearchStatus("idle");
        setSearchError("");
      });
      return () => { active = false; };
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setSearchStatus("loading");
        setSearchError("");
      }
    });

    const timer = window.setTimeout(() => {
      void searchExplore(needle, activeFilter, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setResults(data);
          setSearchStatus("ready");
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchStatus("error");
          setSearchError(
            reason instanceof Error
              ? reason.message
              : "جست‌وجو با خطا مواجه شد.",
          );
        });
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, activeFilter, searchRetry]);

  const resultSummary = useMemo(() => {
    if (searchStatus !== "ready") return "";
    return `${results.length.toLocaleString("fa-IR")} نتیجه`;
  }, [results.length, searchStatus]);

  const clearSearch = () => {
    setQuery("");
    setActiveFilter("all");
    inputRef.current?.focus();
  };

  /** One tab's body; neighbours are rendered the same way so a swipe previews real content. */
  const renderHome = (forTab: ExploreTab) => (
    <>
          {home.status === "loading" ? <HomeSkeleton /> : null}
          {home.status === "error" ? (
            <div className="px-4 py-12 text-center">
              <p className="text-xs text-muted-foreground">پیشنهادهای کاوش دریافت نشدند؛ جست‌وجوی بالا همچنان قابل استفاده است.</p>
              <button type="button" onClick={() => setLandingRetry((value) => value + 1)} className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-muted px-4 text-[11px] font-black text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                بارگذاری دوباره
              </button>
            </div>
          ) : null}
          {home.status === "ready" && home.data ? (
            <ExploreSections
              sections={TAB_SECTIONS[forTab]}
              home={home.data}
              follow={follow}
              onPickTag={(tag) => {
                setQuery(tag);
                setActiveFilter("all");
              }}
            />
          ) : null}
    </>
  );

  return (
    <section
      className="reference-explore min-h-full bg-background pb-[110px] text-foreground"
      aria-label="کاوش و جست‌وجو"
    >
      <header className="reference-explore-header">
        <div className="reference-explore-identity flex items-start justify-between gap-3.5">
          <div>
            <h1 className="text-[30px] lg:text-[34px] font-extrabold leading-tight text-foreground">کاوش</h1>
            <p className="mt-1.5 text-[13px] leading-[1.9] text-muted-foreground">میان روایت‌ها، میدان‌ها، کاربران و محتوای منتشرشده بگردید.</p>
          </div>
          <span aria-hidden="true" className="reference-explore-emblem grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] text-white"><Globe className="h-7 w-7" /></span>
        </div>

        <label className="reference-explore-search flex h-[54px] items-center gap-2.5 rounded-full border border-border bg-surface-muted px-[18px] text-icon-muted transition">
          <Search className="h-5 w-5 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="جست‌وجوی روایت، میدان، محتوا و کاربر…"
            aria-label="جست‌وجو در میدان"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-placeholder"
            dir="rtl"
          />
          {query ? (
            <button type="button" onClick={clearSearch} aria-label="پاک کردن جست‌وجو" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-icon-muted transition-colors hover:text-icon">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>

        {hasQuery ? (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-[18px] pb-2.5" dir="rtl">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-black transition-colors ${active ? "bg-brand text-brand-foreground" : "bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        ) : (
          <nav ref={tabsRef} className="reference-explore-tabs relative grid grid-cols-4 border-b border-divider" aria-label="بخش‌های کاوش">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-current={tab === entry.id ? "page" : undefined}
                onClick={() => setTab(entry.id)}
                className={`relative h-[50px] text-sm font-bold transition-colors ${tab === entry.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {entry.label}
              </button>
            ))}
            {/* One underline that follows the finger while swiping (the strip reads right to left). */}
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-[3px] w-1/4 transition-transform duration-300 ease-out after:absolute after:inset-x-1/4 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-brand after:content-['']"
              style={{ transform: `translateX(${-TABS.findIndex((entry) => entry.id === tab) * 100}%)` }}
            />
          </nav>
        )}
      </header>

      {hasQuery ? (
        <main>
          {singleTag ? (
            <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3.5" dir="rtl">
              <p className="min-w-0 text-[13px] font-bold leading-6 text-foreground">
                شما هم با <span className="text-danger" dir="auto">#{singleTag}</span> روایت منتشر کنید
              </p>
              <Link
                href={`/compose?tag=${encodeURIComponent(singleTag)}` as Route}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-black text-brand-foreground transition-opacity hover:opacity-90"
              >
                <PenLine className="h-3.5 w-3.5" />
                نوشتن
              </Link>
            </div>
          ) : null}
          <div className="flex min-h-11 items-center justify-between border-b border-divider px-4" dir="rtl">
            <p className="min-w-0 truncate text-[11px] font-bold text-muted-foreground">
              نتایج برای «{query.trim()}»
            </p>
            {resultSummary ? (
              <span className="shrink-0 text-[10px] text-foreground-subtle">
                {resultSummary}
              </span>
            ) : null}
          </div>

          {searchStatus === "loading" ? <SearchSkeleton /> : null}

          {searchStatus === "ready" && results.length ? (
            <div className="divide-y divide-divider">
              {results.map((item) => (
                <SearchResultRow key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {searchStatus === "ready" && !results.length ? (
            <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
              <span className="grid h-[76px] w-[76px] place-items-center rounded-full border border-border bg-surface-muted text-icon-muted">
                <SearchX className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-extrabold text-foreground">
                نتیجه‌ای پیدا نشد
              </h2>
              <p className="mt-2 text-[13px] leading-[1.9] text-muted-foreground">
                عبارت کوتاه‌تر یا نوع دیگری از نتیجه را امتحان کنید.
              </p>
            </div>
          ) : null}

          {searchStatus === "error" ? (
            <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-danger-surface text-danger">
                <SearchX className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-extrabold text-foreground">
                جست‌وجو در دسترس نیست
              </h2>
              <p className="mt-2 text-[13px] leading-[1.9] text-muted-foreground">
                {searchError || "ارتباط با سرویس جست‌وجو برقرار نشد."}
              </p>
              <button
                type="button"
                onClick={() => setSearchRetry((value) => value + 1)}
                className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-[11px] font-black text-brand-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تلاش دوباره
              </button>
            </div>
          ) : null}
        </main>
      ) : (
        <main>
          <FeedSwipePager
            index={TABS.findIndex((entry) => entry.id === tab)}
            count={TABS.length}
            onIndexChange={(next) => setTab(TABS[next].id)}
            renderPane={(paneIndex) => renderHome(TABS[paneIndex].id)}
            topBoundaryRef={tabsRef}
            getIndicator={() => indicatorRef.current}
            getLabels={() => tabsRef.current?.querySelectorAll<HTMLElement>("button") ?? null}
          >
            {renderHome(tab)}
          </FeedSwipePager>
        </main>
      )}
    </section>
  );
}
