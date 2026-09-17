"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { SpeakerRequestStatusBadge } from "./AdminStatusBadge";
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import { adminErrorMessage, setSpeakerRequestStatus } from "../services/speakers.service";
import type { SpeakerRequest, SpeakerRequestStatus } from "../types";
import { SPEAKER_REQUEST_STATUSES, SPEAKER_REQUEST_STATUS_LABELS } from "../types";
import { formatAdminDate, formatAdminDateTime } from "../lib/datetime";
import { formatPersianTime } from "@/components/shared/PersianTimePicker";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-divider py-2.5 last:border-b-0">
      <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-left text-[11px] font-bold text-foreground-secondary">
        {value || "—"}
      </span>
    </div>
  );
}

/**
 * A single speaker request / invitation.
 *
 * Moderation is the same PATCH as the list; the detail page exists because the
 * `message` and the internal `admin_note` are long enough to need their own
 * space, and because a decision here is easier to review than in a table row.
 */
export function AdminSpeakerRequestDetailView({
  surface,
  request: initial,
}: {
  surface: "speaker-requests" | "speaker-invitations";
  request: SpeakerRequest;
}) {
  const router = useRouter();
  const [request, setRequest] = useState(initial);
  const [target, setTarget] = useState<SpeakerRequestStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isRequests = surface === "speaker-requests";
  const backHref = `/admin/${surface}`;

  const apply = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await setSpeakerRequestStatus(surface, String(request.id), target);
      setRequest(updated);
      setTarget(null);
      setNotice(`وضعیت به «${SPEAKER_REQUEST_STATUS_LABELS[target]}» تغییر کرد.`);
      router.refresh();
    } catch (reason) {
      setError(adminErrorMessage(reason, "تغییر وضعیت ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={isRequests ? "جزئیات درخواست سخنرانی" : "جزئیات دعوت‌نامه"}
        description={`شناسه #${request.id}`}
        crumbs={[
          { label: isRequests ? "درخواست‌های سخنرانی" : "دعوت‌نامه‌ها", href: backHref },
          { label: `#${request.id}` },
        ]}
        actions={
          <>
            <SpeakerRequestStatusBadge status={request.status} />
            <Link href={backHref as Route} className={secondaryButtonClass}>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
              بازگشت
            </Link>
          </>
        }
      />

      <div className="space-y-4 px-3 py-4 pb-24 sm:px-4">
        {notice ? <AdminNotice tone="success" message={notice} autoHideMs={4000} /> : null}
        {error && !target ? (
          <AdminNotice tone="error" message={error} onDismiss={() => setError(null)} />
        ) : null}

        <section aria-label="اطلاعات درخواست" className="rounded-card border border-border bg-surface px-3.5 py-2">
          <Row label="درخواست‌دهنده / دعوت‌کننده" value={request.requesterName} />
          <Row label="سخنران" value={request.speakerName} />
          <Row label="محل برگزاری" value={request.direction} />
          <Row
            label="زمان درخواستی"
            value={request.requestedDate ? `${formatAdminDate(request.requestedDate)}${request.requestedTime ? `، ${formatPersianTime(request.requestedTime)}` : ""}` : ""}
          />
          <Row label="تاریخ ثبت" value={formatAdminDateTime(request.createdAt)} />
          <Row label="تاریخ تصمیم" value={formatAdminDateTime(request.decidedAt)} />
          {request.requesterUserId ? (
            <Row label="شناسه دعوت‌کننده" value={`#${request.requesterUserId}`} />
          ) : null}
          {request.speakerUserId ? (
            <Row label="شناسه سخنران" value={`#${request.speakerUserId}`} />
          ) : null}
        </section>

        <section aria-label="پیام" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">پیام</h2>
          <p className="mt-2 whitespace-pre-wrap text-[11px] leading-6 text-foreground-secondary">
            {request.message || "پیامی ثبت نشده است."}
          </p>
        </section>

        <section aria-label="یادداشت مدیریت" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">یادداشت مدیریت</h2>
          <p className="mt-2 whitespace-pre-wrap text-[11px] leading-6 text-foreground-secondary">
            {request.adminNote || "یادداشتی ثبت نشده است."}
          </p>
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            این یادداشت فقط در پنل دیده می‌شود و برای طرفین ارسال نمی‌شود.
          </p>
        </section>

        <section aria-label="تصمیم‌گیری" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">تصمیم‌گیری</h2>
          <p className="text-[10px] leading-5 text-muted-foreground">
            با تغییر وضعیت، اعلان مربوطه برای طرف مقابل ارسال می‌شود. بازگشت به «در انتظار»
            تصمیم قبلی را پاک می‌کند.
          </p>
          <div className="flex flex-wrap gap-2">
            {SPEAKER_REQUEST_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={status === request.status}
                onClick={() => {
                  setError(null);
                  setTarget(status);
                }}
                className={
                  status === "rejected" || status === "cancelled"
                    ? dangerButtonClass
                    : status === "accepted"
                      ? primaryButtonClass
                      : secondaryButtonClass
                }
              >
                {busy && target === status ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : null}
                {SPEAKER_REQUEST_STATUS_LABELS[status]}
                {status === request.status ? " (فعلی)" : ""}
              </button>
            ))}
          </div>
        </section>
      </div>

      {target ? (
        <AdminDialog
          title={`تغییر وضعیت به «${SPEAKER_REQUEST_STATUS_LABELS[target]}»`}
          description="این تغییر برای طرفین درخواست اعلان می‌فرستد و در گزارش‌ها ثبت می‌شود."
          confirmLabel="ثبت تصمیم"
          busy={busy}
          error={error}
          tone={target === "rejected" || target === "cancelled" ? "danger" : "default"}
          onConfirm={() => void apply()}
          onClose={() => setTarget(null)}
        />
      ) : null}
    </div>
  );
}
