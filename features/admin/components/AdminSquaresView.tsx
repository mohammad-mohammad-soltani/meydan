"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import { MapPin, MapPinned, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPagination } from "./AdminPagination";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { AdminPageHeader } from "./AdminPageHeader";
import { SquareStatusBadge, VerifiedBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import { adminErrorMessage, deleteSquare, getSquares, linkSquareOutlet } from "../services/squares.service";
import { getCities, getProvinces } from "../services/programs.service";
import type { AdminPage, EntityKind, GeoOption, MediaOutlet, Square, SquareFilters } from "../types";
import {
  EMPTY_SQUARE_FILTERS,
  ENTITY_KIND_LABELS,
  SQUARE_STATUS_LABELS,
  SQUARE_STATUSES,
} from "../types";

/**
 * The squares list.
 *
 * It receives its first page from the server component (so the route is never
 * blank on first paint) and refetches on the client whenever the filter or page
 * changes. The square itself is the row's link, so a row is not a nested
 * button.
 */
export function AdminSquaresView({
  initialPage,
  kind = "square",
  outlets = [],
}: {
  initialPage: AdminPage<Square>;
  /** Which kind of account this list shows; the default keeps the squares page as it was. */
  kind?: EntityKind;
  /** Republishing outlets, offered for linking on the media list only. */
  outlets?: MediaOutlet[];
}) {
  const kindLabel = ENTITY_KIND_LABELS[kind];
  const baseFilters = useMemo<SquareFilters>(() => ({ ...EMPTY_SQUARE_FILTERS, kind }), [kind]);
  const [linkBusy, setLinkBusy] = useState<number | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SquareFilters>(baseFilters);
  const [applied, setApplied] = useState<SquareFilters>(baseFilters);
  const [page, setPage] = useState(initialPage.page || 1);
  const [perPage, setPerPage] = useState(initialPage.perPage || 20);
  const [result, setResult] = useState<AdminPage<Square>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  const firstRender = useRef(true);
  const [squareToDelete, setSquareToDelete] = useState<Square | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void getProvinces()
      .then((items) => setProvinces(items ?? []))
      .catch(() => setProvinces([]));
  }, []);

  /**
   * Cities are fetched from the province change handler, not from an effect on
   * `applied.provinceId`: the province only changes through that handler, and an
   * effect would add a render pass before the request starts.
   */
  const selectProvince = (raw: string) => {
    const provinceId = raw ? Number(raw) : null;
    setFilters((current) => ({ ...current, provinceId, cityId: null }));
    if (!provinceId) {
      setCities([]);
      return;
    }
    void getCities(provinceId)
      .then((items) => setCities(items ?? []))
      .catch(() => setCities([]));
  };

  const load = useCallback(
    async (nextFilters: SquareFilters, nextPage: number, nextPerPage: number) => {
      setLoading(true);
      setError(null);
      try {
        setResult(await getSquares(nextFilters, nextPage, nextPerPage));
      } catch (reason) {
        setError(adminErrorMessage(reason, "دریافت فهرست میادین ممکن نشد."));
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
    // Re-applying the identical filter while on page 1 must still refetch.
    if (page === 1) void load(filters, 1, perPage);
  };

  const resetFilters = () => {
    setFilters(baseFilters);
    setApplied(baseFilters);
    setPage(1);
    void load(baseFilters, 1, perPage);
  };

  const changeLink = async (square: Square, raw: string) => {
    setLinkBusy(square.id);
    setLinkError(null);
    try {
      await linkSquareOutlet(square.id, raw ? Number(raw) : null);
      await load(applied, page, perPage);
    } catch (reason) {
      setLinkError(adminErrorMessage(reason, "لینک رسانه ذخیره نشد."));
    } finally {
      setLinkBusy(null);
    }
  };

  const removeSquare = async () => {
    if (!squareToDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteSquare(String(squareToDelete.id));
      setSquareToDelete(null);
      await load(applied, page, perPage);
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف میدان ممکن نشد."));
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
        placeholder: kind === "square" ? "نام میدان یا نشانی" : `نام ${kindLabel}`,
        value: filters.q,
        onChange: (value) => setFilters((current) => ({ ...current, q: value })),
      },
      {
        kind: "select",
        key: "status",
        label: "وضعیت تأیید",
        value: filters.status,
        options: [
          { value: "", label: "همه وضعیت‌ها" },
          ...SQUARE_STATUSES.map((status) => ({
            value: status,
            label: SQUARE_STATUS_LABELS[status],
          })),
        ],
        onChange: (value) =>
          setFilters((current) => ({ ...current, status: value as SquareFilters["status"] })),
      },
      {
        kind: "toggle",
        key: "verified",
        label: "تأیید نهایی",
        value: filters.verified,
        options: [
          { value: "", label: "همه" },
          { value: "true", label: "تأییدشده" },
          { value: "false", label: "تأییدنشده" },
        ],
        onChange: (value) =>
          setFilters((current) => ({ ...current, verified: value as SquareFilters["verified"] })),
      },
      {
        kind: "select",
        key: "province",
        label: "استان",
        value: filters.provinceId ? String(filters.provinceId) : "",
        options: [
          { value: "", label: "همه استان‌ها" },
          ...provinces.map((province) => ({ value: String(province.id), label: province.name })),
        ],
        onChange: selectProvince,
      },
      {
        kind: "select",
        key: "city",
        label: "شهر",
        value: filters.cityId ? String(filters.cityId) : "",
        disabled: !filters.provinceId,
        options: [
          { value: "", label: filters.provinceId ? "همه شهرها" : "ابتدا استان" },
          ...cities.map((city) => ({ value: String(city.id), label: city.name })),
        ],
        onChange: (value) =>
          setFilters((current) => ({ ...current, cityId: value ? Number(value) : null })),
      },
    ],
    [cities, filters, provinces, kind, kindLabel],
  );

  const columns: Array<AdminColumn<Square>> = [
    {
      key: "name",
      header: kindLabel,
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (square) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
            {square.avatarUrl ? (
              <OptimizedAvatar
                src={square.avatarUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-cover"
              />
            ) : (
              <MapPin aria-hidden="true" className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0">
            <Link
              href={`/admin/squares/${square.id}` as Route}
              className="block truncate text-xs font-black text-foreground hover:text-brand"
            >
              {square.name || `میدان #${square.id}`}
            </Link>
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
              #{square.id}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (square) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <SquareStatusBadge status={square.approvalStatus} />
          <VerifiedBadge verified={square.verified} />
        </div>
      ),
    },
    ...(kind === "media"
      ? [
          {
            key: "outlet",
            header: "رسانه بازنشر",
            render: (square: Square) => (
              <select
                aria-label="رسانه بازنشر لینک‌شده"
                value={square.linkedOutletId ? String(square.linkedOutletId) : ""}
                disabled={linkBusy === square.id}
                onChange={(event) => void changeLink(square, event.target.value)}
                className="min-h-9 w-full min-w-32 rounded-control border border-border bg-surface px-2 text-[11px] font-black text-foreground"
              >
                <option value="">بدون لینک</option>
                {square.linkedOutletId && !outlets.some((outlet) => outlet.id === square.linkedOutletId) ? (
                  <option value={String(square.linkedOutletId)}>رسانه #{square.linkedOutletId} (منتشرنشده)</option>
                ) : null}
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={String(outlet.id)}>{outlet.name}</option>
                ))}
              </select>
            ),
          } satisfies AdminColumn<Square>,
        ]
      : []),
    ...(kind === "square"
      ? [
    {
      key: "location",
      header: "موقعیت",
      render: (square) =>
        square.location ? (
          <span className="block min-w-0 truncate text-[11px] text-foreground-secondary">
            {square.location.address || "—"}
          </span>
        ) : (
          <span className="text-[11px] text-warning-foreground">بدون رکورد جغرافیایی</span>
        ),
    } satisfies AdminColumn<Square>,
      ]
      : []),
    {
      key: "owner",
      header: kind === "square" ? "خادم میدان" : "مالک حساب",
      // Truncated to one line: the owner name is already secondary here, and
      // letting it wrap turned a four-column table into a wall of text.
      render: (square) => (
        <span className="block min-w-0 text-[11px] text-foreground-secondary">
          <span className="block truncate">{square.ownerName || "—"}</span>
          {square.ownerUserId ? (
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
              #{square.ownerUserId}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عملیات",
      className: "w-56 whitespace-nowrap",
      render: (square) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/squares/${square.id}` as Route}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-[11px] font-black text-foreground transition-colors hover:bg-hover"
          >
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            ویرایش
          </Link>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setSquareToDelete(square);
            }}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-danger-border bg-danger-surface px-3 text-[11px] font-black text-danger-foreground transition-colors hover:opacity-80"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            حذف {kindLabel}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={kind === "square" ? "میادین" : `${kindLabel}‌ها`}
        description={kind === "square" ? "فهرست میادین با فیلتر وضعیت، تأیید و محدوده جغرافیایی." : `فهرست حساب‌های ${kindLabel} و فعال‌سازی توسط مدیر.`}
        crumbs={[{ label: kind === "square" ? "میادین" : `${kindLabel}‌ها` }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void load(applied, page, perPage)}
              className={secondaryButtonClass}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={"/admin/squares/new" as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {kind === "square" ? "افزودن میدان" : "افزودن حساب"}
            </Link>
          </>
        }
      />

      <AdminFilters
        filters={filterDescriptors}
        onSubmit={applyFilters}
        onReset={resetFilters}
        busy={loading}
      />

      {linkError ? <p role="alert" className="px-3 pb-2 text-xs font-black text-danger-foreground sm:px-4">{linkError}</p> : null}

      {error ? (
        <AdminErrorState
          message={error}
          onRetry={() => void load(applied, page, perPage)}
          retrying={loading}
        />
      ) : loading ? (
        <AdminTableSkeleton rows={6} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={result.items}
            rowKey={(square) => square.id}
            caption={`فهرست ${kindLabel}‌ها`}
            emptyTitle={`${kindLabel}ی با این فیلترها پیدا نشد.`}
            emptyDescription="فیلترها را تغییر دهید یا یک میدان تازه بسازید."
            emptyIcon={<MapPinned aria-hidden="true" className="h-5 w-5" />}
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
            {fa(result.total)} {kindLabel} در این فیلتر
            {result.paginated ? "" : " (سرور صفحه‌بندی برنگرداند)"}
          </p>
        </>
      )}

      {squareToDelete ? (
        <AdminDialog
          title="حذف میدان"
          description={`«${squareToDelete.name || `میدان ${fa(squareToDelete.id)}`}» به زباله‌دان منتقل می‌شود. حساب مالک و اطلاعات کاربر باقی می‌ماند.`}
          confirmLabel="حذف میدان"
          tone="danger"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void removeSquare()}
          onClose={() => {
            if (!deleteBusy) setSquareToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
