"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Clock, Inbox, Mic } from "lucide-react";
import { useAuthGate } from "@/components/providers/AuthGateProvider";
import { SpeakerCard } from "./SpeakerCard";
import { SpeakerCardSkeleton } from "./SpeakerCardSkeleton";
import { SpeakersFilters } from "./SpeakersFilters";
import { SpeakersSearch } from "./SpeakersSearch";
import { useSpeakers } from "../hooks/useSpeakers";
import type { SpeakerPage } from "../services/speakers.service";
import type { SpeakerCategory } from "../types";

/** Directory of curated speakers with per-row invitations and profile links. */
export function SpeakersView({
  initialSpeakers,
  categories,
  canInvite = false,
  venue = "",
}: {
  initialSpeakers: SpeakerPage;
  categories: SpeakerCategory[];
  /** True only for a signed-in square account; the API enforces it as well. */
  canInvite?: boolean;
  /** The inviting square's own address, previewed in the composer. */
  venue?: string;
}) {
  const { isAuthenticated } = useAuthGate();
  const speakers = useSpeakers(initialSpeakers, categories);
  const shown = speakers.speakers.length;
  const { hasMore, isLoading, isLoadingMore, error, loadMore } = speakers;
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasMore || isLoading || isLoadingMore || error) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "320px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, error, loadMore]);

  return (
    <section id="view-speakers" className="min-h-full bg-background text-foreground">
      <header className="px-4 pb-1 pt-5">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            aria-label="بازگشت به محتوا"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-foreground">اعزام سخنران</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{initialSpeakers.total.toLocaleString("fa-IR")} سخنران در فهرست</p>
          </div>
          {isAuthenticated ? (
            <Link
              href={"/speaker-invitations" as Route}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-surface-muted px-3.5 py-2 text-[11px] font-black text-foreground transition-colors hover:bg-hover"
            >
              <Inbox aria-hidden="true" className="h-3.5 w-3.5" />
              دعوت‌های من
            </Link>
          ) : null}
        </div>
      </header>

      <div className="sticky top-0 z-30 space-y-2 border-b border-border bg-surface-glass px-4 py-2.5 backdrop-blur-md">
        <SpeakersSearch value={speakers.query} onChange={speakers.setQuery} />
        <SpeakersFilters activeFilter={speakers.filter} onChange={speakers.setFilter} options={speakers.categories} />
      </div>

      <main className="space-y-3 p-4 pb-24">
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-4">
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-black text-foreground">سخنران هستید؟</b>
            <small className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">برای حضور در فهرست سخنرانان درخواست ثبت‌نام بدهید.</small>
          </div>
          {/* The registration page is designed but not open yet. */}
          <span aria-disabled="true" className="inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-pill bg-surface-muted px-4 py-2 text-xs font-black text-muted-foreground">
            ثبت‌نام سخنران
            <span className="inline-flex items-center gap-0.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[9px]"><Clock aria-hidden="true" className="h-2.5 w-2.5" />به‌زودی</span>
          </span>
        </div>

        {!speakers.isLoading && speakers.total > 0 ? (
          <p className="px-1 text-[10px] font-bold text-foreground-subtle">
            نمایش {shown.toLocaleString("fa-IR")} از {speakers.total.toLocaleString("fa-IR")} سخنران
          </p>
        ) : null}

        {speakers.isLoading ? (
          <div className="divide-y divide-divider" aria-busy="true" aria-live="polite">
            <span className="sr-only">در حال بارگذاری سخنرانان این دسته‌بندی</span>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <SpeakerCardSkeleton key={index} />
            ))}
          </div>
        ) : shown ? (
          speakers.speakers.map((speaker) => (
            <SpeakerCard key={speaker.id} speaker={speaker} canInvite={canInvite} venue={venue} />
          ))
        ) : (
          <div className="grid min-h-56 place-items-center rounded-card border border-dashed border-border-strong px-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-muted text-brand">
                <Mic aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">سخنرانی با این مشخصات پیدا نشد</p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-foreground-subtle">
                عبارت جستجو را کوتاه‌تر کنید یا دسته‌بندی دیگری را انتخاب کنید.
              </p>
              <button
                type="button"
                onClick={() => {
                  speakers.setQuery("");
                  speakers.setFilter("all");
                }}
                className="mx-auto mt-4 inline-flex min-h-9 items-center rounded-pill border border-brand-border bg-brand-muted px-4 text-[11px] font-black text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        )}
        {speakers.isLoadingMore ? <p className="text-center text-xs text-muted-foreground">در حال دریافت سخنرانان بعدی…</p> : null}
        {speakers.error ? <div role="alert" className="text-center text-xs text-danger-foreground">{speakers.error}<button type="button" onClick={speakers.retry} className="mr-2 underline">تلاش دوباره</button></div> : null}
        <div ref={sentinel} aria-hidden="true" />
      </main>
    </section>
  );
}
