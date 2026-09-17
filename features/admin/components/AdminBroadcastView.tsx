"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { AdminField, fieldClass } from "./AdminField";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  broadcastNotification,
  getCities,
  getProvinces,
} from "../services/programs.service";
import { validateBroadcast, normalizeAudience, foldDigits } from "../lib/normalize";
import {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_AUDIENCE_LABELS,
  type GeoOption,
  type NotificationAudienceType,
} from "../types";

const FIELD_LABELS: Record<string, string> = {
  title: "عنوان",
  body: "متن",
  ids: "شناسه‌ها",
  id: "استان/شهر",
  deepLink: "پیوند داخلی",
};

/**
 * The broadcast composer.
 *
 * `POST /admin/notifications/broadcast` is a fan-out, not a queue: the response
 * is `{ created }`, the number of rows written, and there is no dry run. Two
 * consequences shape the screen — the audience is chosen explicitly (never
 * inferred) and the send is behind a confirmation that restates the target, so a
 * province-wide message cannot be sent by a stray Enter.
 *
 * The audience selectors reuse the public geo data, and `normalizeAudience`
 * drops every key the chosen type does not use so a leftover id or id list can
 * never widen the send.
 */
export function AdminBroadcastView() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationAudienceType>("all");
  const [geoId, setGeoId] = useState<number | null>(null);
  const [idsText, setIdsText] = useState("");
  const [deepLink, setDeepLink] = useState("");

  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ created: number; audience: NotificationAudienceType } | null>(
    null,
  );

  useEffect(() => {
    void getProvinces()
      .then((items) => setProvinces(items ?? []))
      .catch(() => setProvinces([]));
  }, []);

  /**
   * Cities are fetched from the change handler instead of an effect: the only
   * way `geoId` changes is the admin picking a province, so the extra render an
   * effect would cause buys nothing.
   */
  const selectGeo = (raw: string) => {
    const id = raw ? Number(raw) : null;
    setGeoId(id);
    if (type !== "city" || !id) {
      setCities([]);
      return;
    }
    void getCities(id)
      .then((items) => setCities(items ?? []))
      .catch(() => setCities([]));
  };

  const ids = idsText
    .split(/[,،\s\n]+/)
    .map((value) => Math.trunc(Number(foldDigits(value.trim()))))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value, index, list) => list.indexOf(value) === index);

  const audience = normalizeAudience({
    type,
    id: geoId,
    ids,
  });

  const submit = async () => {
    setMessage(null);
    setResult(null);
    setFieldErrors({});

    const errors = validateBroadcast({ title, body, audience, deepLink });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setBusy(true);
    try {
      const created = await broadcastNotification({ title, body, audience, deepLink });
      setResult({ created, audience: audience.type });
      setConfirming(false);
      setTitle("");
      setBody("");
      setDeepLink("");
      setIdsText("");
      setGeoId(null);
      setType("all");
    } catch (reason) {
      setMessage(adminErrorMessage(reason, "ارسال پیام همگانی ممکن نشد."));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  const audienceSummary =
    audience.type === "specific_ids"
      ? `${NOTIFICATION_AUDIENCE_LABELS[audience.type]} (${faLocal(audience.ids.length)} شناسه)`
      : audience.type === "province"
        ? `استان ${provinces.find((province) => province.id === audience.id)?.name ?? "?"}`
        : audience.type === "city"
          ? `شهر ${cities.find((city) => city.id === audience.id)?.name ?? "?"}`
          : NOTIFICATION_AUDIENCE_LABELS[audience.type];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="ارسال پیام همگانی"
        description="ارسال اعلان به گروهی از کاربران. این عملیات بازگشت‌پذیر نیست."
        crumbs={[{ label: "پیام همگانی" }]}
        limitation="تعداد گیرندگان پیش از ارسال نمایش داده نمی‌شود؛ پس از ارسال فقط تعداد ردیف‌های نوشته‌شده گزارش می‌شود."
      />

      <div className="space-y-4 px-3 py-4 pb-24 sm:px-4">
        {result ? (
          <AdminNotice
            tone="success"
            message={`پیام برای ${faLocal(result.created)} گیرنده ثبت شد (${NOTIFICATION_AUDIENCE_LABELS[result.audience]}).`}
          />
        ) : null}

        <AdminFieldMessage message={message} fields={fieldErrors} labels={FIELD_LABELS} />

        <section aria-label="محتوای پیام" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">محتوای پیام</h2>

          <AdminField label="عنوان" htmlFor="broadcast-title" required error={fieldErrors.title}>
            <input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
            />
          </AdminField>

          <AdminField label="متن" htmlFor="broadcast-body" required error={fieldErrors.body}>
            <textarea
              id="broadcast-body"
              value={body}
              rows={5}
              onChange={(event) => setBody(event.target.value)}
              className={`${fieldClass} resize-y`}
            />
          </AdminField>

          <AdminField
            label="پیوند داخلی (اختیاری)"
            htmlFor="broadcast-link"
            error={fieldErrors.deepLink}
            hint="باید با / شروع شود، مثلاً /explore یا /squares/123."
          >
            <input
              id="broadcast-link"
              value={deepLink}
              dir="ltr"
              placeholder="/explore"
              onChange={(event) => setDeepLink(event.target.value)}
              className={`${fieldClass} text-left`}
            />
          </AdminField>
        </section>

        <section aria-label="گیرندگان" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">گیرندگان</h2>

          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="گروه گیرندگان">
            {NOTIFICATION_AUDIENCES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={type === option}
                onClick={() => {
                  setType(option);
                  setGeoId(null);
                }}
                className={`inline-flex min-h-8 items-center rounded-pill border px-3 text-[11px] font-black transition-colors ${
                  type === option
                    ? "border-brand-border bg-selected text-selected-foreground"
                    : "border-border bg-surface text-muted-foreground hover:bg-hover"
                }`}
              >
                {NOTIFICATION_AUDIENCE_LABELS[option]}
              </button>
            ))}
          </div>

          {type === "province" || type === "city" ? (
            <AdminField
              label={type === "province" ? "استان" : "شهر"}
              htmlFor="broadcast-geo"
              required
              error={fieldErrors.id}
            >
              <select
                id="broadcast-geo"
                value={geoId ?? ""}
                onChange={(event) => selectGeo(event.target.value)}
                className={fieldClass}
              >
                <option value="">انتخاب کنید</option>
                {(type === "province" ? provinces : cities).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </AdminField>
          ) : null}

          {type === "specific_ids" ? (
            <AdminField
              label="شناسه کاربران"
              htmlFor="broadcast-ids"
              required
              error={fieldErrors.ids}
              hint="با ویرگول یا فاصله جدا کنید. ارقام فارسی هم پذیرفته می‌شود."
            >
              <textarea
                id="broadcast-ids"
                value={idsText}
                rows={3}
                dir="ltr"
                onChange={(event) => setIdsText(event.target.value)}
                className={`${fieldClass} resize-none text-left`}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {faLocal(ids.length)} شناسه معتبر شناسایی شد.
              </p>
            </AdminField>
          ) : null}

          <p className="rounded-control border border-border bg-surface-muted px-3 py-2 text-[11px] font-bold text-foreground-secondary">
            گیرندگان فعلی: {audienceSummary}
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMessage(null);
              const errors = validateBroadcast({ title, body, audience, deepLink });
              if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                setMessage("چند فیلد نیاز به اصلاح دارد.");
                return;
              }
              setFieldErrors({});
              setConfirming(true);
            }}
            className={primaryButtonClass}
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            {busy ? "در حال ارسال…" : "ارسال پیام"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setBody("");
              setDeepLink("");
              setIdsText("");
              setGeoId(null);
              setType("all");
              setFieldErrors({});
              setMessage(null);
            }}
            className={secondaryButtonClass}
          >
            پاک کردن فرم
          </button>
        </div>

        {confirming ? (
          <section
            role="alertdialog"
            aria-label="تأیید ارسال پیام همگانی"
            className="space-y-3 rounded-card border border-warning-border bg-warning-surface p-3.5"
          >
            <h2 className="flex items-center gap-1.5 text-xs font-black text-warning-foreground">
              <Megaphone aria-hidden="true" className="h-4 w-4" />
              تأیید ارسال
            </h2>
            <p className="text-[11px] leading-6 text-warning-foreground">
              پیام «{title}» برای {audienceSummary} ارسال می‌شود. این عملیات قابل بازگشت نیست و
              اعلان‌ها بلافاصله برای گیرندگان ثبت می‌شوند.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit()}
                className="inline-flex min-h-10 items-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-danger-foreground transition-colors hover:opacity-90"
              >
                {busy ? "در حال ارسال…" : "بله، ارسال کن"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className={secondaryButtonClass}
              >
                انصراف
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** Local Persian digits: importing `fa` would couple this file to the table kit. */
function faLocal(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}
