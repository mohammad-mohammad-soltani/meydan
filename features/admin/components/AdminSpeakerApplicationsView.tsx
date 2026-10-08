"use client";

import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { SpeakerApplicationStatusBadge } from "./AdminStatusBadge";
import { chipActiveClass, chipClass, chipIdleClass, fa, fieldClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  SPEAKER_APPLICATION_STATUS_LABELS,
  adminErrorMessage,
  decideSpeakerApplication,
  getSpeakerApplications,
  type SpeakerApplicationRow,
  type SpeakerApplicationStatus,
} from "../services/speaker-applications.service";
import type { AdminListResult } from "../types";
import { formatAdminDate } from "../lib/datetime";

type Decision = { row: SpeakerApplicationRow; status: "approved" | "rejected" };

/** درخواست‌های «ثبت‌نام سخنران»: approve (optionally verified) or reject. */
export function AdminSpeakerApplicationsView({ initial }: { initial: AdminListResult<SpeakerApplicationRow> }) {
  const [status, setStatus] = useState<SpeakerApplicationStatus | "">("");
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<Decision | null>(null);
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = useCallback(async (next: SpeakerApplicationStatus | "") => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getSpeakerApplications(next));
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  const open = (row: SpeakerApplicationRow, next: "approved" | "rejected") => {
    setDecision({ row, status: next });
    setVerified(false);
    setNote("");
    setDialogError(null);
  };

  const apply = async () => {
    if (!decision) return;
    setBusy(true);
    setDialogError(null);
    try {
      await decideSpeakerApplication(decision.row.id, {
        status: decision.status,
        verified: decision.status === "approved" && verified,
        adminNote: note.trim(),
      });
      setDecision(null);
      void load(status);
    } catch (reason) {
      setDialogError(adminErrorMessage(reason, "ثبت تصمیم ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const columns: Array<AdminColumn<SpeakerApplicationRow>> = [
    {
      key: "who",
      header: "متقاضی",
      primary: true,
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-xs font-black text-foreground">{row.fullName}</span>
          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
            {row.city} · {row.categoryName}{row.handle ? ` · @${row.handle}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "details",
      header: "جزئیات",
      render: (row) => (
        <div className="min-w-0 space-y-0.5 text-[11px] text-foreground-secondary">
          <span className="block truncate">موضوعات: {row.topics}</span>
          <span dir="ltr" className="block truncate text-right">{row.phone}</span>
          {row.link ? <a href={row.link} target="_blank" rel="noopener noreferrer" dir="ltr" className="block truncate text-right text-brand">{row.link}</a> : null}
          {row.about ? <span className="block line-clamp-2">{row.about}</span> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <SpeakerApplicationStatusBadge status={row.status} />
          {row.status === "approved" && row.verified ? <span className="text-[10px] font-bold text-info-foreground">نشان‌دار</span> : null}
        </div>
      ),
    },
    {
      key: "created",
      header: "تاریخ ثبت",
      render: (row) => <span className="text-xs text-foreground-secondary">{formatAdminDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "اقدام",
      render: (row) =>
        row.status === "pending" ? (
          <div className="flex gap-1.5">
            <button type="button" onClick={() => open(row, "approved")} className={primaryButtonClass}>تأیید</button>
            <button type="button" onClick={() => open(row, "rejected")} className={secondaryButtonClass}>رد</button>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="ثبت‌نام سخنرانان"
        description="درخواست‌هایی که کاربران برای حضور در فهرست سخنرانان ثبت کرده‌اند. با تأیید، حساب کاربر سخنران می‌شود."
        crumbs={[{ label: "ثبت‌نام سخنرانان" }]}
        actions={
          <button type="button" onClick={() => void load(status)} className={secondaryButtonClass}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            بازخوانی
          </button>
        }
      />

      <div className="border-b border-divider bg-surface px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="فیلتر وضعیت">
          {([{ value: "", label: "همه" }, ...(Object.keys(SPEAKER_APPLICATION_STATUS_LABELS) as SpeakerApplicationStatus[]).map((value) => ({ value, label: SPEAKER_APPLICATION_STATUS_LABELS[value] }))] as Array<{ value: SpeakerApplicationStatus | ""; label: string }>).map((option) => {
            const active = status === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => { setStatus(option.value); void load(option.value); }}
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
            caption="ثبت‌نام سخنرانان"
            emptyTitle="درخواستی پیدا نشد."
            emptyDescription="وضعیت دیگری را انتخاب کنید."
          />
          <p className="px-3 pb-6 pt-2 text-[10px] text-muted-foreground sm:px-4">{fa(result.items.length)} ردیف نمایش داده شد</p>
        </>
      )}

      {decision ? (
        <AdminDialog
          title={decision.status === "approved" ? `تأیید «${decision.row.fullName}»` : `رد «${decision.row.fullName}»`}
          description={decision.status === "approved" ? "حساب این کاربر سخنران می‌شود و در فهرست سخنرانان نمایش داده می‌شود." : "کاربر از نتیجه مطلع می‌شود."}
          confirmLabel={decision.status === "approved" ? "تأیید درخواست" : "رد درخواست"}
          tone={decision.status === "rejected" ? "danger" : "default"}
          busy={busy}
          error={dialogError}
          onConfirm={() => void apply()}
          onClose={() => setDecision(null)}
        >
          <div className="space-y-4 px-5 py-4">
            {decision.status === "approved" ? (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-foreground">
                <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                سخنران نشان‌دار (تأییدشده) باشد
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">{decision.status === "rejected" ? "دلیل رد (برای کاربر نمایش داده می‌شود)" : "یادداشت مدیر"} (اختیاری)</span>
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} className={`${fieldClass} py-3`} />
            </label>
          </div>
        </AdminDialog>
      ) : null}
    </div>
  );
}
