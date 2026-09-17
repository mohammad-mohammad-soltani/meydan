"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CalendarRange, Plus, RefreshCw, Users } from "lucide-react";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminPagination } from "./AdminPagination";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { ProgramStatusBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import { PROGRAM_LIST_PAGE_SIZE, adminErrorMessage, getPrograms, type ProgramKind, type ProgramPage } from "../services/programs.service";
import { PROGRAM_STATUSES, PROGRAM_STATUS_LABELS, type Program } from "../types";
import { formatAdminDate } from "../lib/datetime";

/**
 * The initiative/campaign list.
 *
 * `GET /admin/{kind}` uses `page`/`per_page` with `per_page` capped at 50 by the
 * controller, and reports `meta.total`. The view keeps the server-rendered first
 * page and only refetches when the admin actually changes something.
 */
export function AdminProgramsView({
  kind,
  initial,
}: {
  kind: ProgramKind;
  initial: ProgramPage;
}) {
  const [page, setPage] = useState(initial.page);
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitiative = kind === "initiatives";
  const singular = isInitiative ? "ابتکار" : "کمپین";

  const load = useCallback(
    async (nextPage: number, nextStatus: string) => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await getPrograms(kind, nextPage, PROGRAM_LIST_PAGE_SIZE);
        // The list endpoint has no `status` filter, so it is applied locally.
        setResult(
          nextStatus
            ? { ...fetched, items: fetched.items.filter((item) => item.status === nextStatus) }
            : fetched,
        );
        setPage(nextPage);
      } catch (reason) {
        setError(adminErrorMessage(reason, `دریافت فهرست ${singular} ممکن نشد.`));
      } finally {
        setLoading(false);
      }
    },
    [kind, singular],
  );

  const descriptors: AdminFilter[] = [
    {
      kind: "select",
      key: "status",
      label: "وضعیت",
      value: status,
      hint: "فیلتر وضعیت روی همین صفحه اعمال می‌شود؛ فهرست سرور فیلتر وضعیت ندارد.",
      options: [
        { value: "", label: "همه وضعیت‌ها" },
        ...PROGRAM_STATUSES.map((item) => ({
          value: item,
          label: PROGRAM_STATUS_LABELS[item],
        })),
      ],
      onChange: setStatus,
    },
  ];

  const columns: Array<AdminColumn<Program>> = [
    {
      key: "title",
      header: isInitiative ? "ابتکار" : "کمپین",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (program) => (
        <div className="min-w-0">
          <Link
            href={`/admin/${kind}/${program.id}` as Route}
            className="block truncate text-xs font-black text-foreground hover:text-brand"
          >
            {program.title || `${singular} #${program.id}`}
          </Link>
          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
            {program.description || "بدون توضیح"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (program) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <ProgramStatusBadge status={program.status} />
          {program.current ? (
            <span className="rounded-pill border border-info-border bg-info-surface px-2 py-0.5 text-[10px] font-black text-info-foreground">
              جاری
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "participants",
      header: "شرکت‌کنندگان",
      render: (program) =>
        isInitiative ? (
          <Link
            href={`/admin/initiatives/${program.id}/participants` as Route}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-link hover:text-link-hover"
          >
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            {fa(program.participantCount)}
          </Link>
        ) : (
          <span className="text-[11px] text-muted-foreground">{fa(program.participantCount)}</span>
        ),
    },
    {
      key: "dates",
      header: "بازه",
      render: (program) => (
        <span className="text-xs text-foreground-secondary">
          {[program.startsAt && formatAdminDate(program.startsAt), program.endsAt && formatAdminDate(program.endsAt)].filter(Boolean).join(" ← ") || "—"}
        </span>
      ),
    },
    {
      key: "content",
      header: "محتوا",
      render: (program) => (
        <span className="text-[11px] text-foreground-secondary">
          {fa(program.linkedContent.length)} پیوند
        </span>
      ),
    },
    {
      key: "order",
      header: "ترتیب",
            render: (program) => (
        <span className="font-mono text-[10px] text-muted-foreground">{fa(program.order)}</span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={isInitiative ? "ابتکارها" : "کمپین‌ها"}
        description={
          isInitiative
            ? "ساخت و مدیریت ابتکارها، برنامه زمانی و شرکت‌کنندگان."
            : "ساخت و مدیریت کمپین‌ها و محتوای پیوندشده."
        }
        crumbs={[{ label: isInitiative ? "ابتکارها" : "کمپین‌ها" }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void load(page, appliedStatus)}
              className={secondaryButtonClass}
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={`/admin/${kind}/new` as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {isInitiative ? "ابتکار تازه" : "کمپین تازه"}
            </Link>
          </>
        }
      />

      <AdminFilters
        filters={descriptors}
        onSubmit={() => {
          setAppliedStatus(status);
          void load(page, status);
        }}
        onReset={() => {
          setStatus("");
          setAppliedStatus("");
          void load(1, "");
        }}
        busy={loading}
        resetLabel="پاک کردن فیلتر"
      />

      {error ? (
        <AdminErrorState
          message={error}
          onRetry={() => void load(page, appliedStatus)}
          retrying={loading}
        />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={result.items}
            rowKey={(program) => program.id}
            caption={isInitiative ? "فهرست ابتکارها" : "فهرست کمپین‌ها"}
            emptyTitle={
              appliedStatus
                ? "موردی با این وضعیت در این صفحه نیست."
                : `${singular}ی ثبت نشده است.`
            }
            emptyDescription={
              appliedStatus
                ? "فیلتر را پاک کنید یا صفحه دیگری را ببینید."
                : `برای شروع یک ${singular} تازه بسازید.`
            }
            emptyIcon={<CalendarRange aria-hidden="true" className="h-5 w-5" />}
          />

          <AdminPagination
            page={result.page}
            perPage={result.perPage}
            total={result.total}
            pages={result.pages ?? Math.max(1, Math.ceil(result.total / Math.max(1, result.perPage)))}
            busy={loading}
            /* `status` is applied locally, so page changes always fetch unfiltered. */
            onPageChange={(next) => {
              setAppliedStatus("");
              setStatus("");
              void load(next, "");
            }}
          />
        </>
      )}
    </div>
  );
}
