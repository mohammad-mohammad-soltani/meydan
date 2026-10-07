"use client";

import "../reference-speakers.css";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Mic } from "lucide-react";
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
    <section id="view-speakers" className="reference-speakers min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/content"
            aria-label="بازگشت به محتوا"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[var(--m-soft)] text-[var(--m-tx)] transition-colors hover:bg-hover"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-extrabold text-foreground">اعزام سخنران</h1>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{initialSpeakers.total.toLocaleString("fa-IR")} سخنران در فهرست</p>
          </div>
          {isAuthenticated ? (
            <Link
              href={"/speaker-invitations" as Route}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border border-[var(--m-line)] bg-[var(--m-soft)] px-3.5 text-[12.5px] font-bold text-[var(--m-tx)] transition-colors hover:bg-hover"
            >
              دعوت‌های من
            </Link>
          ) : null}
        </div>
      </header>

      <div className="space-y-2 px-4 pb-3 pt-1">
        <SpeakersSearch value={speakers.query} onChange={speakers.setQuery} />
        <SpeakersFilters activeFilter={speakers.filter} onChange={speakers.setFilter} options={speakers.categories} />
      </div>

      <main className="pb-[30px]">
        <div className="mx-4 mb-3.5 mt-0.5 flex items-center gap-3 rounded-[20px] border border-[var(--m-line)] bg-[var(--m-soft)] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-extrabold text-[var(--m-tx)]">سخنران هستید؟</b>
            <small className="mt-[3px] block text-[11.5px] leading-[1.7] text-[var(--m-mu)]">برای حضور در فهرست سخنرانان درخواست ثبت‌نام بدهید.</small>
          </div>
          <Link
            href={"/speaker-signup" as Route}
            className="inline-flex h-[38px] shrink-0 items-center rounded-pill bg-[#e4152e] px-4 text-[12.5px] font-extrabold text-white transition-colors hover:bg-[#b50d22]"
          >
            ثبت‌نام سخنران
          </Link>
        </div>

        {!speakers.isLoading && speakers.total > 0 ? (
          <p className="px-[18px] pb-1.5 text-[11.5px] text-muted-foreground">
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
