"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  FileText,
  Flame,
  Hash,
  MapPin,
  MessageSquareText,
  Mic2,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { getExploreLanding, searchExplore } from "../services/explore.service";
import type {
  ExploreFilter,
  ExploreLanding,
  ExploreResult,
  ExploreResultKind,
} from "../types";

const emptyLanding: ExploreLanding = {
  suggestions: [],
  content: [],
  topics: [],
  trends: [],
};

const filters: Array<{
  id: ExploreFilter;
  label: string;
  icon: typeof Search;
}> = [
  { id: "all", label: "همه", icon: Search },
  { id: "narrative", label: "روایت‌ها", icon: MessageSquareText },
  { id: "square", label: "میدان‌ها", icon: MapPin },
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

          {item.verified ? (
            <BadgeCheck
              aria-label="تأییدشده"
              className="h-4 w-4 shrink-0 fill-verified text-on-solid"
            />
          ) : null}

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

export function ExploreView() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("all");
  const [results, setResults] = useState<ExploreResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [searchError, setSearchError] = useState("");
  const [landing, setLanding] = useState<ExploreLanding>(emptyLanding);
  const [landingStatus, setLandingStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [searchRetry, setSearchRetry] = useState(0);
  const [landingRetry, setLandingRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setLandingStatus("loading"); });

    void getExploreLanding()
      .then((data) => {
        if (cancelled) return;
        setLanding(data);
        setLandingStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setLandingStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [landingRetry]);

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

  return (
    <section
      className="min-h-full bg-background pb-24 text-foreground"
      aria-label="کاوش و جست‌وجو"
    >
      <header className="sticky top-0 z-40 border-b border-divider bg-surface-glass backdrop-blur-xl">
        <div className="flex items-center gap-2 px-2 py-2.5 sm:px-3">
          <Link
            href="/home"
            aria-label="بازگشت"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-hover"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>

          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-surface-muted px-3.5 text-icon-muted ring-1 ring-transparent transition focus-within:bg-surface focus-within:ring-ring">
            <Search className="h-[18px] w-[18px] shrink-0" />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="جست‌وجوی روایت، میدان، محتوا و کاربر…"
              aria-label="جست‌وجو در میدان"
              className="h-11 min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-placeholder"
              dir="rtl"
            />

            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="پاک کردن جست‌وجو"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-icon-muted transition-colors hover:text-icon"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
        </div>

        {hasQuery ? (
          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 no-scrollbar" dir="rtl">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-black transition-colors ${
                    active
                      ? "bg-brand text-brand-foreground"
                      : "bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {hasQuery ? (
        <main>
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
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-icon-muted">
                <SearchX className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-sm font-black text-foreground">
                نتیجه‌ای پیدا نشد
              </h2>
              <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                عبارت کوتاه‌تر یا نوع دیگری از نتیجه را امتحان کنید.
              </p>
            </div>
          ) : null}

          {searchStatus === "error" ? (
            <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-danger-surface text-danger">
                <SearchX className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-sm font-black text-foreground">
                جست‌وجو در دسترس نیست
              </h2>
              <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
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
          <section className="border-b border-divider px-4 py-5" dir="rtl">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-foreground">کاوش</h1>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  میان روایت‌ها، میدان‌ها، کاربران و محتوای منتشرشده بگردید.
                </p>
              </div>
              <Sparkles className="h-5 w-5 shrink-0 text-brand" />
            </div>

            {landing.topics.length ? (
              <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
                {landing.topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setQuery(topic.title.replace(/^#/, ""));
                      setActiveFilter("topic");
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full bg-surface-muted px-3 py-2 text-[10px] font-black text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground"
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {landingStatus === "loading" ? (
            <div className="space-y-7 px-4 py-5" aria-hidden="true">
              <div>
                <div className="h-4 w-28 animate-pulse rounded-full bg-skeleton" />
                <div className="mt-4 flex gap-3 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="w-20 shrink-0 text-center">
                      <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-skeleton" />
                      <div className="mx-auto mt-2 h-2.5 w-14 animate-pulse rounded-full bg-skeleton" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded-full bg-skeleton" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-xl bg-skeleton" />
                ))}
              </div>
            </div>
          ) : null}

          {landingStatus === "error" ? (
            <div className="px-4 py-10 text-center">
              <p className="text-xs text-muted-foreground">
                پیشنهادهای کاوش دریافت نشدند؛ جست‌وجوی بالا همچنان قابل استفاده است.
              </p>
              <button
                type="button"
                onClick={() => setLandingRetry((value) => value + 1)}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-muted px-4 text-[11px] font-black text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                بارگذاری دوباره
              </button>
            </div>
          ) : null}

          {landingStatus === "ready" ? (
            <div>
              {landing.suggestions.length ? (
                <section className="border-b border-divider py-5" dir="rtl">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-sm font-black text-foreground">
                      پیشنهاد برای شما
                    </h2>
                    <span className="text-[10px] text-muted-foreground">
                      میدان‌ها و افراد
                    </span>
                  </div>

                  <div className="mt-4 flex gap-4 overflow-x-auto px-4 pb-1 no-scrollbar">
                    {landing.suggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href as Route}
                        className="w-[76px] shrink-0 text-center"
                      >
                        <span className="relative mx-auto block h-14 w-14">
                          {item.avatarUrl ? (
                            <OptimizedAvatar
                              src={item.avatarUrl}
                              alt=""
                              width={56}
                              className="rounded-full object-cover ring-1 ring-border"
                            />
                          ) : (
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-muted text-brand">
                              {item.kind === "square" ? (
                                <MapPin className="h-5 w-5" />
                              ) : (
                                <UserRound className="h-5 w-5" />
                              )}
                            </span>
                          )}

                          {item.verified ? (
                            <BadgeCheck className="absolute -bottom-0.5 -left-0.5 h-4 w-4 fill-verified text-on-solid" />
                          ) : null}
                        </span>

                        <span className="mt-2 line-clamp-2 block text-[10px] font-black leading-4 text-foreground">
                          {item.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {landing.trends.length ? (
                <section className="border-b border-divider" dir="rtl">
                  <div className="flex items-center gap-2 px-4 pb-2 pt-5">
                    <Flame className="h-[18px] w-[18px] text-brand" />
                    <div>
                      <h2 className="text-sm font-black text-foreground">
                        روایت‌های داغ
                      </h2>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        در ۲۴ ساعت اخیر
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-divider">
                    {landing.trends.map((trend, index) => (
                      <Link
                        key={trend.id}
                        href={trend.href as Route}
                        className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-hover"
                      >
                        <span className="w-6 shrink-0 pt-0.5 text-center text-[11px] font-black tabular-nums text-foreground-subtle">
                          {(index + 1).toLocaleString("fa-IR")}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <strong className="truncate text-[12px] font-black text-foreground">
                              {trend.authorName}
                            </strong>
                            {trend.verified ? (
                              <BadgeCheck className="h-4 w-4 shrink-0 fill-verified text-on-solid" />
                            ) : null}
                            {trend.tag ? (
                              <span className="truncate text-[10px] font-bold text-brand">
                                {trend.tag}
                              </span>
                            ) : null}
                          </span>

                          <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-foreground-secondary">
                            {trend.body}
                          </span>

                          {trend.meta ? (
                            <span className="mt-1 block text-[10px] text-muted-foreground">
                              {trend.meta}
                            </span>
                          ) : null}
                        </span>

                        <ChevronLeft className="mt-4 h-4 w-4 shrink-0 text-icon-muted transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {landing.content.length ? (
                <section className="py-5" dir="rtl">
                  <div className="flex items-center justify-between px-4 pb-2">
                    <h2 className="text-sm font-black text-foreground">
                      محتوای پیشنهادی
                    </h2>
                    <Link
                      href="/content"
                      className="inline-flex items-center gap-1 text-[10px] font-black text-brand"
                    >
                      همه محتواها
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="divide-y divide-divider">
                    {landing.content.map((item) => (
                      <SearchResultRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ) : null}

              {!landing.suggestions.length &&
              !landing.trends.length &&
              !landing.content.length ? (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-icon-muted">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 text-sm font-black text-foreground">
                    برای کاوش آماده‌ایم
                  </h2>
                  <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                    از نوار جست‌وجوی بالا برای پیدا کردن روایت‌ها، میدان‌ها، کاربران و محتوا استفاده کنید.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </main>
      )}
    </section>
  );
}
