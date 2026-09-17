"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { RefreshCw } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminListCapNotice } from "./AdminPagination";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { SpeakerRequestStatusBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass, chipActiveClass, chipClass, chipIdleClass } from "./styles";
import {
  adminErrorMessage,
  getSpeakerInvitations,
  getSpeakerRequests,
  setSpeakerRequestStatus,
} from "../services/speakers.service";
import type { AdminListResult, SpeakerRequest, SpeakerRequestStatus } from "../types";
import { SPEAKER_REQUEST_STATUS_LABELS, SPEAKER_REQUEST_STATUSES } from "../types";

export type SpeakerRequestSurface = "speaker-requests" | "speaker-invitations";

/**
 * درخواست‌های سخنرانی and دعوت‌نامه‌ها share one backend table and one
 * controller (`AdminSpeakerRequestController`), so they share this view. The
 * route prefix is the only difference, which is why `surface` also decides the
 * collection path used for the status PATCH.
 *
 * The list is `LIMIT 100` with no pagination; the cap is labelled rather than
 * paginated, and the status change is optimistic with a rollback on failure.
 */
export function AdminSpeakerRequestsView({
  surface,
  initial,
}: {
  surface: SpeakerRequestSurface;
  initial: AdminListResult<SpeakerRequest>;
}) {
  const [status, setStatus] = useState<SpeakerRequestStatus | "">("");
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<{ row: SpeakerRequest; status: SpeakerRequestStatus } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = useCallback(
    async (next: SpeakerRequestStatus | "") => {
      setLoading(true);
      setError(null);
      try {
        const fetched =
          surface === "speaker-requests"
            ? await getSpeakerRequests({ status: next })
            : await getSpeakerInvitations({ status: next });
        setResult(fetched);
      } catch (reason) {
        setError(adminErrorMessage(reason, "دریافت فهرست ممکن نشد."));
      } finally {
        setLoading(false);
      }
    },
    [surface],
  );

  const applyStatus = async () => {
    if (!pending) return;
    const previous = result;
    setBusy(true);
    setDialogError(null);

    // Optimistic: the table updates before the request settles.
    setResult((current) => ({
      ...current,
      items: current.items.map((row) =>
        row.id === pending.row.id ? { ...row, status: pending.status } : row,
      ),
    }));

    try {
      await setSpeakerRequestStatus(surface, String(pending.row.id), pending.status);
      setPending(null);
      void load(status);
    } catch (reason) {
      setResult(previous);
      setDialogError(adminErrorMessage(reason, "تغییر وضعیت ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const isRequests = surface === "speaker-requests";

  const columns: Array<AdminColumn<SpeakerRequest>> = [
    {
      key: "who",
      header: isRequests ? "درخواست‌دهنده" : "دعوت‌شده",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (row) => {
        const primary = isRequests ? row.requesterName : row.speakerName;
        const secondary = isRequests ? row.speakerName : row.requesterName;
        return (
          <div className="min-w-0">
            <Link
              href={`/admin/${surface}/${row.id}` as Route}
              className="block truncate text-xs font-black text-foreground hover:text-brand"
            >
              {primary || `#${row.id}`}
            </Link>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {isRequests ? `سخنران: ${secondary}` : `دعوت‌کننده: ${secondary}`}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <SpeakerRequestStatusBadge status={row.status} />,
    },
    {
      key: "when",
      header: "زمان درخواستی",
      render: (row) => (
        <span className="font-mono text-[10px] text-foreground-secondary" dir="ltr">
          {[row.requestedDate, row.requestedTime].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    {
      key: "message",
      header: "پیام",
      render: (row) => (
        <span className="block min-w-0 truncate text-[11px] text-foreground-secondary">
          {row.message || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={isRequests ? "درخواست‌های سخنرانی" : "دعوت‌نامه‌های سخنران"}
        description={
          isRequests
            ? "درخواست‌هایی که میادین برای اعزام سخنران ثبت کرده‌اند."
            : "دعوت‌نامه‌هایی که برای سخنرانان ثبت شده است."
        }
        crumbs={[{ label: isRequests ? "درخواست‌های سخنرانی" : "دعوت‌نامه‌ها" }]}
        limitation="این فهرست صفحه‌بندی ندارد و حداکثر ۱۰۰ ردیف را برمی‌گرداند."
        actions={
          <button type="button" onClick={() => void load(status)} className={secondaryButtonClass}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            بازخوانی
          </button>
        }
      />

      <div className="border-b border-divider bg-surface px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="فیلتر وضعیت">
          {[{ value: "", label: "همه" }, ...SPEAKER_REQUEST_STATUSES.map((item) => ({
            value: item,
            label: SPEAKER_REQUEST_STATUS_LABELS[item],
          }))].map((option) => {
            const active = status === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const next = option.value as SpeakerRequestStatus | "";
                  setStatus(next);
                  void load(next);
                }}
                className={`${chipClass} ${active ? chipActiveClass : chipIdleClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(status)} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={result.items}
            rowKey={(row) => row.id}
            caption={isRequests ? "درخواست‌های سخنرانی" : "دعوت‌نامه‌ها"}
            emptyTitle="موردی با این فیلتر پیدا نشد."
            emptyDescription="وضعیت دیگری را انتخاب کنید."
          />
          <AdminListCapNotice shown={result.items.length} cap={result.cap ?? 100} />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">
            {fa(result.items.length)} ردیف نمایش داده شد
          </p>
        </>
      )}

      {pending ? (
        <AdminDialog
          title={`تغییر وضعیت به «${SPEAKER_REQUEST_STATUS_LABELS[pending.status]}»`}
          description="طرف مربوطه بر اساس همین وضعیت مطلع می‌شود."
          confirmLabel="تغییر وضعیت"
          busy={busy}
          error={dialogError}
          tone={pending.status === "rejected" || pending.status === "cancelled" ? "danger" : "default"}
          onConfirm={() => void applyStatus()}
          onClose={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}
