"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus, RefreshCw, Sparkles } from "lucide-react";
import { AdminCheckbox } from "./AdminField";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { VerifiedBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import {
  CREATOR_LIST_LIMITATION,
  adminErrorMessage,
  getCreators,
} from "../services/creators.service";
import type { Creator } from "../types";

/**
 * The producer directory.
 *
 * `GET /creators` only returns `publish` rows and caps at 50, same shape as the
 * speaker list, so drafts are again only reachable through wp-admin and the
 * header says so.
 */
export function AdminCreatorsView({ initial }: { initial: Creator[] }) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextQuery: string, nextVerified: boolean) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getCreators({ q: nextQuery, verified: nextVerified, category: "" }));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست تولیدکنندگان ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  const descriptors: AdminFilter[] = [
    {
      kind: "search",
      key: "q",
      label: "جست‌وجو",
      placeholder: "نام تولیدکننده",
      value: query,
      onChange: setQuery,
    },
    {
      kind: "custom",
      key: "verified",
      label: "تأیید",
      render: (
        <AdminCheckbox
          id="creators-verified"
          label="فقط تأییدشده‌ها"
          checked={verified}
          onChange={setVerified}
        />
      ),
    },
  ];

  const columns: Array<AdminColumn<Creator>> = [
    {
      key: "name",
      header: "تولیدکننده",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (creator) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-muted text-[11px] font-black text-brand">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatarUrl} alt="" className="h-9 w-9 object-cover" />
            ) : (
              creator.name.trim().slice(0, 1) || "؟"
            )}
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/creators/${creator.id}` as Route}
              className="block truncate text-xs font-black text-foreground hover:text-brand"
            >
              {creator.name || `تولیدکننده #${creator.id}`}
            </Link>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {creator.role || creator.expertise || "—"}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "types",
      header: "نوع",
      render: (creator) =>
        creator.types.length ? (
          <span className="flex flex-wrap gap-1">
            {creator.types.slice(0, 3).map((type) => (
              <span
                key={type}
                className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[10px] text-foreground-secondary"
              >
                {type}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        ),
    },
    {
      key: "verified",
      header: "وضعیت",
      render: (creator) => <VerifiedBadge verified={creator.verified} />,
    },
    {
      key: "id",
      header: "شناسه",
            render: (creator) => (
        <span className="font-mono text-[10px] text-muted-foreground">#{creator.id}</span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="تولیدکنندگان"
        description="مدیریت تولیدکنندگان محتوا و سرویس‌های رسانه‌ای."
        crumbs={[{ label: "تولیدکنندگان" }]}
        limitation={CREATOR_LIST_LIMITATION}
        actions={
          <>
            <button
              type="button"
              onClick={() => void load(applied, verified)}
              className={secondaryButtonClass}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={"/admin/creators/new" as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              تولیدکننده تازه
            </Link>
          </>
        }
      />

      <AdminFilters
        filters={descriptors}
        onSubmit={() => {
          setApplied(query);
          void load(query, verified);
        }}
        onReset={() => {
          setQuery("");
          setApplied("");
          setVerified(false);
          void load("", false);
        }}
        busy={loading}
        resetLabel="پاک کردن فیلتر"
      />

      {error ? (
        <AdminErrorState
          message={error}
          onRetry={() => void load(applied, verified)}
          retrying={loading}
        />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={rows}
            rowKey={(creator) => creator.id}
            caption="فهرست تولیدکنندگان"
            emptyTitle="تولیدکننده‌ای پیدا نشد."
            emptyDescription="فیلترها را پاک کنید یا یک تولیدکننده تازه بسازید."
            emptyIcon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
          />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(rows.length)} تولیدکننده · حداکثر ۵۰ ردیف
          </p>
        </>
      )}
    </div>
  );
}
