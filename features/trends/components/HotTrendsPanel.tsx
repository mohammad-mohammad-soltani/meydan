"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { compactFa } from "@/lib/meydan-api";
import { useIsDesktop } from "@/components/layouts/useIsDesktop";
import { getHotTrends } from "../services/trends.service";
import type { HotTrend } from "../types";

type Status = "loading" | "ready" | "error";

const SKELETON_ROWS = [0, 1, 2];

/**
 * Desktop trends board for the left column. It fetches only from `lg` up (the
 * column is CSS-hidden below that) and always shows a real state — skeleton,
 * list, empty or retry — so the sidebar never renders placeholder prose.
 */
export function HotTrendsPanel() {
  const isDesktop = useIsDesktop();
  const [trends, setTrends] = useState<HotTrend[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isDesktop) return;

    const controller = new AbortController();

    void getHotTrends(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setTrends(items);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || (reason as { name?: string })?.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [isDesktop, attempt]);

  // The retry press — not an effect — is what returns the panel to its skeleton.
  function retry() {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  return (
    <section
      aria-labelledby="hot-trends-title"
      aria-busy={status === "loading"}
      className="rounded-card border border-border bg-card p-3.5 text-xs text-card-foreground shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="hot-trends-title" className="flex items-center gap-1.5 font-black text-foreground">
          <TrendingUp aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" />
          ترندهای داغ میادین
        </h2>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-success motion-safe:animate-pulse"
          />
          زنده
        </span>
      </div>

      {status === "loading" ? (
        <div className="mt-3 space-y-3" aria-hidden="true">
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="animate-pulse space-y-1.5">
              <div className="h-2 w-20 rounded-full bg-skeleton" />
              <div className="h-3 w-full rounded-full bg-skeleton" />
              <div className="h-2 w-14 rounded-full bg-skeleton" />
            </div>
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-control bg-surface-muted px-2.5 py-2 text-[11px]">
          <span className="text-muted-foreground">ترندها در دسترس نیست.</span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-1 font-black text-brand outline-none transition-colors hover:bg-brand-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw aria-hidden="true" className="h-3 w-3" />
            تلاش دوباره
          </button>
        </div>
      ) : null}

      {status === "ready" && !trends.length ? (
        <div className="mt-3 rounded-control bg-surface-muted px-3 py-3 text-center text-[11px] leading-6 text-muted-foreground">
          <p>هنوز ترندی در ۲۴ ساعت گذشته ثبت نشده است.</p>
          <Link
            href="/explore"
            className="mt-1 inline-block rounded-pill px-2 py-0.5 font-black text-brand outline-none transition-colors hover:bg-brand-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            کاوش روایت‌های میدانی
          </Link>
        </div>
      ) : null}

      {status === "ready" && trends.length ? (
        <ol className="mt-2.5 divide-y divide-divider">
          {trends.map((trend) => (
            <li key={trend.id}>
              <Link
                href={trend.href as Route}
                className="-mx-1.5 block rounded-control px-1.5 py-2 outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="font-black text-brand">{compactFa(trend.rank)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{trend.context}</span>
                </span>
                <span className="mt-1 block truncate font-black text-foreground">{trend.title}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{trend.metric}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
