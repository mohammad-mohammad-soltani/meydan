"use client";

import { AdminEditor } from "./AdminEditor";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PersianDatePicker } from "@/components/shared/PersianDatePicker";
import { AdminDialog } from "./AdminDialog";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { AdminField, fieldClass } from "./AdminField";
import { AdminNotice } from "./AdminNotice";
import { AdminSuccessToast } from "./AdminSuccessToast";
import { AdminPageHeader } from "./AdminPageHeader";
import { ChannelFields } from "./ChannelFields";
import { GeoPickerField, type GeoValue } from "./GeoPickerField";
import { MediaPickerField } from "./MediaPickerField";
import { PostStatusBadge, SquareStatusBadge, VerifiedBadge } from "./AdminStatusBadge";
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  deleteSquare,
  setSquareStatus,
  updateSquare,
} from "../services/squares.service";
import {
  buildSquareUpdate,
  validateSquareUpdate,
  type SquareFormState,
} from "../lib/normalize";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  SQUARE_STATUSES,
  SQUARE_STATUS_LABELS,
  type Square,
  type SquareStatus,
} from "../types";

function reasonMessages(fields?: Record<string, string>): Record<string, string> {
  if (!fields) return {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, reason]) => [key, fieldErrorMessage(reason)]),
  );
}

function toFormState(square: Square): SquareFormState {
  return {
    squareName: square.name,
    description: square.description,
    contactName: "",
    contactPhone: "",
    startDate: "",
    avatarMediaId: null,
    eitaaChannel: square.eitaaChannel,
    baleChannel: square.baleChannel,
    // Location only travels when the admin actually changes it.
    geoMoved: false,
    location: {
      provinceId: square.location?.provinceId ?? null,
      cityId: square.location?.cityId ?? null,
      address: square.location?.address ?? "",
      latitude: square.location?.latitude ?? null,
      longitude: square.location?.longitude ?? null,
    },
  };
}

/**
 * Square detail: view, edit, change approval status, and soft delete.
 *
 * `PATCH` only accepts a few fields, and the geographic block only moves as a
 * set — `GeoPickerField` plus `geoMoved` enforce that. Approval is a separate
 * `POST /status` endpoint because it also fires the owner notification, so it
 * gets its own form with an `admin_note`.
 */
export function AdminSquareDetailView({ square: initial }: { square: Square }) {
  const router = useRouter();
  const [square, setSquare] = useState(initial);
  const [form, setForm] = useState<SquareFormState>(() => toFormState(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saved, setSaved] = useState<{ id: number; message: string } | null>(null);

  const [statusDialog, setStatusDialog] = useState<SquareStatus | null>(null);
  const [adminNote, setAdminNote] = useState(initial.adminNote);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const geo: GeoValue = form.location;

  const save = async () => {
    if (saving || uploadBusy) return;
    setFieldErrors({});
    setFormError(null);
    setSaved(null);

    const errors = validateSquareUpdate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSquare(String(square.id), buildSquareUpdate(form));
      setSquare(updated);
      setForm(toFormState(updated));
      setSaved({ id: Date.now(), message: "تغییرات ذخیره شد." });
    } catch (reason) {
      const fields =
        reason && typeof reason === "object" && "fields" in reason
          ? (reason as { fields?: Record<string, string> }).fields
          : undefined;
      setFieldErrors(reasonMessages(fields));
      setFormError(adminErrorMessage(reason, "ذخیره تغییرات ممکن نشد."));
    } finally {
      setSaving(false);
    }
  };

  const applyStatus = async () => {
    if (!statusDialog) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const updated = await setSquareStatus(String(square.id), statusDialog, adminNote);
      setSquare(updated);
      setStatusDialog(null);
      setSaved({ id: Date.now(), message: `وضعیت به «${SQUARE_STATUS_LABELS[statusDialog]}» تغییر کرد.` });
    } catch (reason) {
      setStatusError(adminErrorMessage(reason, "تغییر وضعیت ممکن نشد."));
    } finally {
      setStatusBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteSquare(String(square.id));
      router.push("/admin/squares" as Route);
      router.refresh();
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف میدان ممکن نشد."));
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={square.name || `میدان #${square.id}`}
        description={square.location?.address || "نشانی ثبت نشده است."}
        crumbs={[{ label: "میادین", href: "/admin/squares" }, { label: square.name || `#${square.id}` }]}
      />

      <AdminEditor title="ویرایش اطلاعات میدان" onSubmit={(event) => event.preventDefault()}>
        {formError ? (
          <div className="admin-form-notice"><AdminNotice tone="error" message={formError} onDismiss={() => setFormError(null)} /></div>
        ) : null}

        <section aria-label="خلاصه میدان" className="admin-form-card admin-form-wide">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
              {square.avatarUrl ? (
                <Image
                  src={square.avatarUrl}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized={square.avatarUrl.startsWith("http")}
                  className="h-14 w-14 object-cover"
                />
              ) : (
                <MapPin aria-hidden="true" className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <SquareStatusBadge status={square.approvalStatus} />
                <VerifiedBadge verified={square.verified} />
                <PostStatusBadge status={square.postStatus} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                شناسه میدان #{square.id}
                {square.ownerUserId ? ` · مالک #${square.ownerUserId}` : ""}
                {square.ownerName ? ` (${square.ownerName})` : ""}
              </p>
            </div>
          </div>

          {square.adminNote ? (
            <p className="mt-3 rounded-control border border-border bg-surface-muted px-3 py-2 text-[11px] leading-6 text-foreground-secondary">
              یادداشت مدیریت: {square.adminNote}
            </p>
          ) : null}

          {square.location ? (
            <div className="mt-3 grid gap-2 text-[11px] text-foreground-secondary sm:grid-cols-2">
              <p>استان #{square.location.provinceId} · شهر #{square.location.cityId}</p>
              <p dir="ltr" className="text-left text-xs">
                {square.location.latitude.toFixed(5)}, {square.location.longitude.toFixed(5)}
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-control border border-warning-border bg-warning-surface px-3 py-2 text-[11px] text-warning-foreground">
              این میدان رکورد جغرافیایی ندارد؛ روی نقشه میادین دیده نمی‌شود. برای افزودن موقعیت،
              بخش «موقعیت» را پر و ذخیره کنید.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/users/square/${square.id}`}
              className={secondaryButtonClass}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              نمایه عمومی
            </a>
          </div>
        </section>

        <section aria-label="ویرایش میدان" className="admin-form-card admin-form-wide space-y-4">
          <h2>مشخصات میدان</h2>

          <AdminField label="نام میدان" htmlFor="detail-name" required error={fieldErrors.square_name}>
            <input
              id="detail-name"
              value={form.squareName}
              onChange={(event) => setForm({ ...form, squareName: event.target.value })}
              className={fieldClass}
            />
          </AdminField>

          <AdminField label="توضیحات" htmlFor="detail-description">
            <textarea
              id="detail-description"
              value={form.description}
              rows={3}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          <div>
            <span className="block text-[11px] font-black text-foreground-secondary">
              تاریخ شروع فعالیت
            </span>
            <p className="mt-1 text-[10px] text-muted-foreground">
              خالی گذاشتن، تاریخ را پاک می‌کند. مقدار نامعتبر در سرور بی‌صدا نادیده گرفته می‌شود.
            </p>
            <div className="mt-1.5">
              <PersianDatePicker
                value={form.startDate}
                onChange={(value) => setForm({ ...form, startDate: value })}
                allow="any"
                ariaLabel="تاریخ شروع فعالیت"
                placeholder="انتخاب تاریخ"
              />
            </div>
            {fieldErrors.start_date ? (
              <p role="alert" className="mt-1 text-[10px] font-bold text-danger-foreground">
                {fieldErrors.start_date}
              </p>
            ) : null}
          </div>

        </section>

        <section aria-label="موقعیت" className="admin-form-card admin-form-wide space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2>موقعیت مکانی</h2>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                جابه‌جایی موقعیت فقط با ارسال هم‌زمان استان، شهر، نشانی، عرض و طول جغرافیایی انجام
                می‌شود؛ همین دلیل است که این بخش یک کلید فعال/غیرفعال دارد.
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 rounded-control border border-border bg-surface px-2.5 py-1.5 text-[10px] font-black text-foreground-secondary">
              <input
                type="checkbox"
                checked={form.geoMoved}
                onChange={(event) => setForm({ ...form, geoMoved: event.target.checked })}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              تغییر موقعیت
            </label>
          </div>

          <div className={form.geoMoved ? "" : "pointer-events-none opacity-60"}>
            <GeoPickerField
              idPrefix="detail-geo"
              value={geo}
              disabled={!form.geoMoved}
              onChange={(next) => setForm({ ...form, location: next })}
              errors={{
                province_id: fieldErrors.province_id,
                city_id: fieldErrors.city_id,
                address: fieldErrors.address,
                latitude: fieldErrors.latitude,
                longitude: fieldErrors.longitude,
              }}
            />
          </div>
        </section>

        <AdminDisclosureSection title="اطلاعات رابط" className="admin-form-side" defaultOpen={Boolean(form.contactName || form.contactPhone)} hasError={Boolean(fieldErrors.contact_name || fieldErrors.contact_phone)}>
          <AdminField label="نام رابط" htmlFor="detail-contact-name" error={fieldErrors.contact_name}>
            <input id="detail-contact-name" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className={fieldClass} />
          </AdminField>
          <AdminField label="تلفن رابط" htmlFor="detail-contact-phone" error={fieldErrors.contact_phone}>
            <input id="detail-contact-phone" value={form.contactPhone} dir="ltr" inputMode="tel" onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} className={`${fieldClass} text-left`} />
          </AdminField>
        </AdminDisclosureSection>

        <AdminDisclosureSection title="شبکه‌های اجتماعی" className="admin-form-side" defaultOpen={Boolean(form.eitaaChannel || form.baleChannel)} hasError={Boolean(fieldErrors.eitaa_channel || fieldErrors.bale_channel)}>
          <ChannelFields idPrefix="detail-channels" eitaa={form.eitaaChannel} bale={form.baleChannel}
            onChange={(next) => setForm({ ...form, eitaaChannel: next.eitaa, baleChannel: next.bale })}
            errors={{ eitaa_channel: fieldErrors.eitaa_channel, bale_channel: fieldErrors.bale_channel }} />
        </AdminDisclosureSection>

        <AdminDisclosureSection title="تصویر میدان" className="admin-form-side" defaultOpen={Boolean(square.avatarUrl)} hasError={Boolean(fieldErrors.avatar_media_id)}>
          <MediaPickerField id="detail-avatar" label="تغییر نشان میدان" hint="اگر فایلی انتخاب نکنید، تصویر فعلی دست‌نخورده می‌ماند." mediaId={form.avatarMediaId} currentUrl={square.avatarUrl} onChange={(mediaId) => setForm((current) => ({ ...current, avatarMediaId: mediaId }))} onBusyChange={setUploadBusy} />
        </AdminDisclosureSection>

        <section aria-label="وضعیت تأیید" className="admin-form-card admin-form-wide space-y-3">
          <h2 className="flex items-center gap-1.5 text-xs font-black text-foreground-secondary">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
            وضعیت تأیید
          </h2>
          <p className="text-[10px] leading-5 text-muted-foreground">
            تغییر وضعیت، اعلان مربوطه را برای مالک می‌فرستد؛ «یادداشت مدیریت» همراه همان اعلان
            نمایش داده می‌شود.
          </p>

          <AdminField label="یادداشت مدیریت" htmlFor="detail-admin-note">
            <textarea
              id="detail-admin-note"
              value={adminNote}
              rows={3}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="دلیل تأیید، رد یا تعلیق"
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          <div className="flex flex-wrap gap-2">
            {SQUARE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={status === square.approvalStatus}
                onClick={() => {
                  setStatusError(null);
                  setStatusDialog(status);
                }}
                className={
                  status === "rejected" || status === "suspended"
                    ? dangerButtonClass
                    : secondaryButtonClass
                }
              >
                {SQUARE_STATUS_LABELS[status]}
                {status === square.approvalStatus ? " (فعلی)" : ""}
              </button>
            ))}
          </div>
        </section>

        <div className="admin-form-actions">
          <button type="button" onClick={() => void save()} disabled={saving || uploadBusy} className={primaryButtonClass}>
            {saving ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
          <Link href={"/admin/squares" as Route} className={secondaryButtonClass}>
            بازگشت به فهرست
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            className={dangerButtonClass}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            حذف میدان
          </button>
        </div>

      </AdminEditor>

      {saved ? <AdminSuccessToast key={saved.id} message={saved.message} /> : null}

      {statusDialog ? (
        <AdminDialog
          title={`تغییر وضعیت به «${SQUARE_STATUS_LABELS[statusDialog]}»`}
          description={
            statusDialog === "approved"
              ? "میدان منتشر می‌شود و اعلان تأیید برای مالک ارسال می‌گردد."
              : statusDialog === "rejected"
                ? "میدان رد می‌شود و اعلان به‌همراه یادداشت مدیریت برای مالک ارسال می‌گردد."
                : statusDialog === "suspended"
                  ? "میدان تعلیق می‌شود و از دسترس عموم خارج می‌گردد."
                  : "میدان به صف بررسی بازمی‌گردد."
          }
          confirmLabel="تغییر وضعیت"
          busy={statusBusy}
          error={statusError}
          tone={statusDialog === "rejected" || statusDialog === "suspended" ? "danger" : "default"}
          onConfirm={() => void applyStatus()}
          onClose={() => setStatusDialog(null)}
        />
      ) : null}

      {deleteOpen ? (
        <AdminDialog
          title="حذف میدان"
          description={`«${square.name}» به زباله‌دان منتقل می‌شود. این عملیات نرم است و رکورد در وردپرس باقی می‌ماند.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </div>
  );
}
