"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { Flower2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPagination } from "./AdminPagination";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { AdminPageHeader } from "./AdminPageHeader";
import { PostStatusBadge, VerifiedBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import { adminErrorMessage, deleteMemorial, getMemorials } from "../services/memorials.service";
import type { AdminPage, Memorial, MemorialFilters } from "../types";
import { EMPTY_MEMORIAL_FILTERS } from "../types";

/**
 * The یادبود (memorial) list.
 *
 * It receives its first page from the server component (so the route is never
 * blank on first paint) and refetches on the client whenever the filter or page
 * changes, mirroring `AdminSquaresView`. A memorial has no approval workflow —
 * just a draft/publish post status and a verified flag — so this list is
 * simpler: one search filter, no geography, no outlet linking.
 */
export function AdminMemorialsView({ initialPage }: { initialPage: AdminPage<Memorial> }) {
  const [filters, setFilters] = useState<MemorialFilters>(EMPTY_MEMORIAL_FILTERS);
  const [applied, setApplied] = useState<MemorialFilters>(EMPTY_MEMORIAL_FILTERS);
  const [page, setPage] = useState(initialPage.page || 1);
  const [perPage, setPerPage] = useState(initialPage.perPage || 20);
  const [result, setResult] = useState<AdminPage<Memorial>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRender = useRef(true);
  const [toDelete, setToDelete] = useState<Memorial | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(
    async (nextFilters: MemorialFilters, nextPage: number, nextPerPage: number) => {
      setLoading(true);
      setError(null);
      try {
        setResult(await getMemorials(nextFilters, nextPage, nextPerPage));
      } catch (reason) {
        setError(adminErrorMessage(reason, "دریافت فهرست یادبودها ممکن نشد."));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // The server already rendered this first combination.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void load(applied, page, perPage);
  }, [applied, page, perPage, load]);

  const applyFilters = () => {
    setPage(1);
    setApplied(filters);
    if (page === 1) void load(filters, 1, perPage);
  };

  const resetFilters = () => {
    setFilters(EMPTY_MEMORIAL_FILTERS);
    setApplied(EMPTY_MEMORIAL_FILTERS);
    setPage(1);
    void load(EMPTY_MEMORIAL_FILTERS, 1, perPage);
  };

  const removeMemorial = async () => {
    if (!toDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteMemorial(String(toDelete.id));
      setToDelete(null);
      await load(applied, page, perPage);
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف یادبود ممکن نشد."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const filterDescriptors: AdminFilter[] = useMemo(
    () => [
      {
        kind: "search",
        key: "q",
        label: "جست‌وجو",
        placeholder: "نام یادبود",
        value: filters.q,
        onChange: (value) => setFilters((current) => ({ ...current, q: value })),
      },
    ],
    [filters],
  );

  const columns: Array<AdminColumn<Memorial>> = [
    {
      key: "name",
      header: "یادبود",
      primary: true,
      render: (memorial) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
            {memorial.avatarUrl ? (
              <OptimizedAvatar src={memorial.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 object-cover" />
            ) : (
              <Flower2 aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0">
            <Link href={`/admin/memorials/${memorial.id}` as Route} className="block truncate text-xs font-black text-foreground hover:text-brand">
              {memorial.name || `یادبود #${memorial.id}`}
            </Link>
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">#{memorial.id}</span>
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (memorial) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <PostStatusBadge status={memorial.postStatus} />
          <VerifiedBadge verified={memorial.verified} />
        </div>
      ),
    },
    {
      key: "dates",
      header: "تولد — درگذشت",
      hideOnMobile: true,
      render: (memorial) => (
        <span className="block min-w-0 truncate text-[11px] text-foreground-secondary" dir="ltr">
          {memorial.birthDate || "—"} – {memorial.deathDate || "—"}
        </span>
      ),
    },
    {
      key: "handle",
      header: "شناسه کاربری",
      hideOnMobile: true,
      render: (memorial) => (
        <span className="block min-w-0 truncate text-[11px] text-foreground-secondary" dir="ltr">
          {memorial.handle ? `@${memorial.handle}` : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-56 whitespace-nowrap",
      render: (memorial) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/memorials/${memorial.id}` as Route}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-[11px] font-black text-foreground transition-colors hover:bg-hover"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            ویرایش
          </Link>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setToDelete(memorial);
            }}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-danger-border bg-danger-surface px-3 text-[11px] font-black text-danger-foreground transition-colors hover:opacity-80"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="یادبودها"
        description="فهرست حساب‌های یادبود؛ بیوگرافی، تایم‌لاین زندگی و قاب‌های ماندگار هر یادبود از صفحه جزئیات آن قابل ویرایش است."
        crumbs={[{ label: "یادبودها" }]}
        actions={
          <>
            <button type="button" onClick={() => void load(applied, page, perPage)} className={secondaryButtonClass}>
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={"/admin/memorials/new" as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              افزودن یادبود
            </Link>
          </>
        }
      />

      <AdminFilters filters={filterDescriptors} onSubmit={applyFilters} onReset={resetFilters} busy={loading} />

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(applied, page, perPage)} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={6} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={result.items}
            rowKey={(memorial) => memorial.id}
            caption="فهرست یادبودها"
            emptyTitle="یادبودی با این فیلتر پیدا نشد."
            emptyDescription="فیلتر را تغییر دهید یا یک یادبود تازه بسازید."
            emptyIcon={<Flower2 aria-hidden="true" className="h-5 w-5" />}
          />
          <AdminPagination
            page={result.page}
            pages={result.pages}
            total={result.total}
            perPage={result.perPage}
            busy={loading}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPage(1);
              setPerPage(value);
            }}
          />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(result.total)} یادبود در این فیلتر
            {result.paginated ? "" : " (سرور صفحه‌بندی برنگرداند)"}
          </p>
        </>
      )}

      {toDelete ? (
        <AdminDialog
          title="حذف یادبود"
          description={`«${toDelete.name || `یادبود ${fa(toDelete.id)}`}» برای همیشه حذف می‌شود؛ این عملیات قابل بازگشت نیست.`}
          confirmLabel="حذف یادبود"
          tone="danger"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void removeMemorial()}
          onClose={() => {
            if (!deleteBusy) setToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
