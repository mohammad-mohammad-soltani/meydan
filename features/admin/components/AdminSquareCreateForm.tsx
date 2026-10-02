"use client";

import { HandleInput } from "@/components/shared/HandleInput";
import { AdminEditor } from "./AdminEditor";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { PersianDatePicker, tehranTodayIso } from "@/components/shared/PersianDatePicker";
import { AdminField, fieldClass } from "./AdminField";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { ChannelFields } from "./ChannelFields";
import { GeoPickerField, EMPTY_GEO, type GeoValue } from "./GeoPickerField";
import { MediaPickerField } from "./MediaPickerField";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { adminErrorMessage, createSquare } from "../services/squares.service";
import { getCities } from "../services/programs.service";
import { validateSquareCreate } from "../lib/normalize";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  SQUARE_CREATE_STATUSES,
  SQUARE_STATUS_LABELS,
  type SquareCreateInput,
  type SquareCreateStatus,
} from "../types";

const DEFAULT_STATUS: SquareCreateStatus = "pending_verification";

/** Maps the API's `error.fields` reason codes onto Persian field messages. */
function fieldMessages(fields?: Record<string, string>): Record<string, string> {
  if (!fields) return {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, reason]) => [key, fieldErrorMessage(reason)]),
  );
}

/**
 * «افزودن میدان» — the panel's headline action.
 *
 * It builds a *square account* and its square in one write
 * (`SquareAdminService::create`), which is why the owner's phone/name/email sit
 * beside the square's own fields. Three backend behaviours drive the UI:
 *
 * 1. There is no `name` input — the title is `square_name`.
 * 2. `status=approved` creates the square published but sends the owner **no
 *    notification**; the form says so before submit.
 * 3. An invalid `start_date` is silently ignored rather than rejected, so the
 *    date is validated in the browser first.
 */
export function AdminSquareCreateForm() {
  const router = useRouter();
  const [status, setStatus] = useState<SquareCreateStatus>(DEFAULT_STATUS);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [squareName, setSquareName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [startDate, setStartDate] = useState(() => tehranTodayIso());
  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [geo, setGeo] = useState<GeoValue>(EMPTY_GEO);
  const [channels, setChannels] = useState({ eitaa: "", bale: "" });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [geoPending, setGeoPending] = useState(false);

  const input: SquareCreateInput = useMemo(
    () => ({
      phone,
      fullName,
      email,
      handle,
      squareName,
      description,
      contactName,
      contactPhone,
      startDate,
      avatarMediaId,
      provinceId: geo.provinceId,
      cityId: geo.cityId,
      address: geo.address,
      latitude: geo.latitude,
      longitude: geo.longitude,
      locationSource: geo.locationSource,
      eitaaChannel: channels.eitaa,
      baleChannel: channels.bale,
      status,
    }),
    [
      channels.bale,
      channels.eitaa,
      contactName,
      contactPhone,
      description,
      email,
      fullName,
      geo,
      handle,
      phone,
      squareName,
      startDate,
      status,
      avatarMediaId,
    ],
  );

  const submit = async () => {
    if (busy || uploadBusy || geoPending) return;
    setFormError(null);
    setFieldErrors({});

    const validation = validateSquareCreate(input);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      setFormError("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setBusy(true);
    try {
      const created = await createSquare(input);
      // The Persian city name is only needed for the success message; the
      // server already validated the province/city pair, and a failed lookup
      // must not turn a successful create into an error.
      const cities = geo.provinceId
        ? await getCities(geo.provinceId).catch(() => [])
        : [];
      const cityName = cities.find((city) => city.id === geo.cityId)?.name ?? "";
      setCreated({
        id: created.id,
        name: squareName,
        cityName,
      });
      router.refresh();
    } catch (reason) {
      // The service throws a MeydanApiError carrying the API's own fields map.
      const fields =
        reason && typeof reason === "object" && "fields" in reason
          ? (reason as { fields?: Record<string, string> }).fields
          : undefined;
      setFieldErrors(fieldMessages(fields));
      setFormError(adminErrorMessage(reason, "ساخت میدان ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const [created, setCreated] = useState<{ id: number; name: string; cityName: string } | null>(
    null,
  );

  if (created) {
    return (
      <div className="min-h-full bg-background">
        <AdminPageHeader
          title="میدان ساخته شد"
          crumbs={[{ label: "میادین", href: "/admin/squares" }, { label: "افزودن میدان" }]}
        />
        <div className="px-3 py-4 sm:px-4">
          <AdminNotice
            tone="success"
            message={
              status === "approved"
                ? `«${created.name}»${created.cityName ? ` در ${created.cityName}` : ""} ساخته و تأیید شد. برای مالک اعلانی ارسال نشد.`
                : `«${created.name}»${created.cityName ? ` در ${created.cityName}` : ""} ساخته شد و در صف تأیید است.`
            }
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/squares/${created.id}` as Route}
              className={primaryButtonClass}
            >
              مشاهده میدان
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setSquareName("");
                setDescription("");
                setGeo(EMPTY_GEO);
                setAvatarMediaId(null);
                setChannels({ eitaa: "", bale: "" });
                setStartDate(tehranTodayIso());
              }}
              className={secondaryButtonClass}
            >
              افزودن میدان دیگر
            </button>
            <Link href={"/admin/squares" as Route} className={secondaryButtonClass}>
              بازگشت به فهرست
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
          title="افزودن میدان"
          description="حساب خادم میدان و میدان هم‌زمان ساخته می‌شوند؛ نام خادم و نام میدان مستقل از هم هستند و هر دو الزامی‌اند."
        crumbs={[{ label: "میادین", href: "/admin/squares" }, { label: "افزودن میدان" }]}
      />

      <AdminEditor
        className=""
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {formError ? <div className="admin-form-notice"><AdminNotice tone="error" message={formError} onDismiss={() => setFormError(null)} /></div> : null}

        <section aria-label="مشخصات میدان" className="admin-form-card admin-form-main space-y-4">
          <h2>مشخصات میدان</h2>

          <AdminField
            label="نام میدان"
            htmlFor="square-name"
            required
            error={fieldErrors.square_name}
            hint="نامی که مخاطبان در فهرست میادین می‌بینند."
          >
            <input
              id="square-name"
              value={squareName}
              aria-invalid={fieldErrors.square_name ? true : undefined}
              onChange={(event) => setSquareName(event.target.value)}
              className={fieldClass}
            />
          </AdminField>

          <AdminField
            label="شناسه کاربری"
            htmlFor="square-handle"
            error={fieldErrors.handle}
            hint="اختیاری؛ اگر خالی بماند از نام میدان ساخته می‌شود."
          >
            <HandleInput
              id="square-handle"
              value={handle}
              onChange={setHandle}
              nameHint={squareName}
              required={false}
              serverError={fieldErrors.handle}
              inputClassName={fieldClass}
            />
          </AdminField>

          <AdminField label="توضیحات" htmlFor="square-description" error={fieldErrors.description}>
            <textarea
              id="square-description"
              value={description}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          <div>
            <span className="block text-[11px] font-black text-foreground-secondary">
              تاریخ شروع فعالیت (اختیاری)
            </span>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              روز آغاز فعالیت میدان را در تقویم انتخاب کنید.
            </p>
            <div className="mt-1.5">
              <PersianDatePicker
                value={startDate}
                onChange={setStartDate}
                allow="any"
                ariaLabel="انتخاب تاریخ شروع فعالیت"
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            {fieldErrors.start_date ? (
              <p role="alert" className="mt-1 text-[10px] font-bold text-danger-foreground">
                {fieldErrors.start_date}
              </p>
            ) : null}
          </div>

        </section>

        <section aria-label="حساب خادم میدان" className="admin-form-card admin-form-side">
          <h2>حساب خادم میدان</h2>
          <div className="admin-field-grid">
            <AdminField
              label="شماره موبایل"
              htmlFor="square-phone"
              required
              error={fieldErrors.phone}
              hint="بدون صفر ابتدایی هم پذیرفته می‌شود."
            >
              <input
                id="square-phone"
                value={phone}
                inputMode="tel"
                dir="ltr"
                aria-invalid={fieldErrors.phone ? true : undefined}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="09123456789"
                className={`${fieldClass} text-left`}
              />
            </AdminField>

            <AdminField
              label="نام و نام خانوادگی خادم میدان"
              htmlFor="square-full-name"
              required
              error={fieldErrors.full_name}
              hint="این نام فقط برای حساب خادم میدان است و مستقل از نام میدان ذخیره می‌شود."
            >
              <input
                id="square-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={fieldClass}
              />
            </AdminField>

            <AdminField
              label="ایمیل"
              htmlFor="square-email"
              error={fieldErrors.email}
              hint="اختیاری؛ اگر وارد شود نباید قبلاً ثبت شده باشد."
            >
              <input
                id="square-email"
                value={email}
                type="email"
                dir="ltr"
                aria-invalid={fieldErrors.email ? true : undefined}
                onChange={(event) => setEmail(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
          </div>
        </section>

        <section aria-label="موقعیت میدان" className="admin-form-card admin-form-wide">
          <h2>موقعیت میدان</h2>
          <GeoPickerField
            idPrefix="square-geo"
            value={geo}
            onChange={setGeo}
            errors={{
              province_id: fieldErrors.province_id,
              city_id: fieldErrors.city_id,
              address: fieldErrors.address,
              latitude: fieldErrors.latitude,
              longitude: fieldErrors.longitude,
            }}
            onPendingChange={setGeoPending}
          />
        </section>

        <section aria-label="وضعیت اولیه" className="admin-form-card admin-form-wide">
          <fieldset>
            <legend className="text-sm font-black text-foreground">وضعیت اولیه</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SQUARE_CREATE_STATUSES.map((option) => (
                <label
                  key={option}
                  className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-control border px-3 py-2.5 transition-colors ${
                    status === option ? "border-brand-border bg-brand-muted/60" : "border-border bg-surface hover:bg-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="square-status"
                    value={option}
                    checked={status === option}
                    onChange={() => setStatus(option)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-foreground-secondary">{SQUARE_STATUS_LABELS[option]}</span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">
                      {option === "approved"
                        ? "میدان منتشر می‌شود اما اعلانی برای مالک ارسال نمی‌شود."
                        : "میدان در صف بررسی می‌ماند و پس از تأیید، مالک مطلع می‌شود."}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {fieldErrors.status ? <p role="alert" className="mt-2 text-xs font-bold text-danger-foreground">{fieldErrors.status}</p> : null}
          </fieldset>
        </section>

        <AdminDisclosureSection
          title="اطلاعات رابط"
          className="admin-form-side"
          hasError={Boolean(fieldErrors.contact_name || fieldErrors.contact_phone)}
        >
          <div className="admin-field-grid">
            <AdminField label="نام رابط" htmlFor="square-contact-name" error={fieldErrors.contact_name}>
              <input id="square-contact-name" value={contactName} onChange={(event) => setContactName(event.target.value)} className={fieldClass} />
            </AdminField>
            <AdminField label="تلفن رابط" htmlFor="square-contact-phone" error={fieldErrors.contact_phone}>
              <input id="square-contact-phone" value={contactPhone} inputMode="tel" dir="ltr" onChange={(event) => setContactPhone(event.target.value)} className={`${fieldClass} text-left`} />
            </AdminField>
          </div>
        </AdminDisclosureSection>

        <AdminDisclosureSection title="تصویر میدان" className="admin-form-side" defaultOpen hasError={Boolean(fieldErrors.avatar_media_id)}>
          <MediaPickerField id="square-avatar" label="نشان میدان" hint="یک تصویر واضح برای معرفی میدان انتخاب کنید." mediaId={avatarMediaId} onChange={setAvatarMediaId} onBusyChange={setUploadBusy} />
        </AdminDisclosureSection>

        <AdminDisclosureSection
          title="شبکه‌های اجتماعی"
          className="admin-form-side"
          hasError={Boolean(fieldErrors.eitaa_channel || fieldErrors.bale_channel)}
        >
          <ChannelFields
            idPrefix="square-channels"
            eitaa={channels.eitaa}
            bale={channels.bale}
            onChange={setChannels}
            errors={{
              eitaa_channel: fieldErrors.eitaa_channel,
              bale_channel: fieldErrors.bale_channel,
            }}
          />
        </AdminDisclosureSection>

        {status === "approved" ? (
          <div className="admin-form-notice"><AdminNotice
            tone="info"
            message="با انتخاب «تأییدشده» میدان بلافاصله منتشر می‌شود و اعلانی برای مالک ارسال نمی‌شود."
          /></div>
        ) : null}

        <div className="admin-form-actions">
          <button type="submit" disabled={busy || uploadBusy || geoPending} className={primaryButtonClass}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "در حال ساخت…" : geoPending ? "در حال تشخیص موقعیت…" : "ساخت میدان"}
          </button>
          <Link href={"/admin/squares" as Route} className={secondaryButtonClass}>
            بازگشت به فهرست
          </Link>
        </div>
      </AdminEditor>
    </div>
  );
}
