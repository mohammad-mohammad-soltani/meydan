"use client";

import { HandleInput } from "@/components/shared/HandleInput";
import { AdminEditor } from "./AdminEditor";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { AdminField, fieldClass } from "./AdminField";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { MediaPickerField } from "./MediaPickerField";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import { adminErrorMessage, createMemorial } from "../services/memorials.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  MEMORIAL_STATUSES,
  MEMORIAL_STATUS_LABELS,
  type MemorialCreateInput,
  type MemorialStatus,
} from "../types";

const DEFAULT_STATUS: MemorialStatus = "draft";

/** Maps the API's `error.fields` reason codes onto Persian field messages. */
function fieldMessages(fields?: Record<string, string>): Record<string, string> {
  if (!fields) return {};
  return Object.fromEntries(Object.entries(fields).map(([key, reason]) => [key, fieldErrorMessage(reason)]));
}

function validate(input: MemorialCreateInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "نام یادبود الزامی است.";
  return errors;
}

/**
 * «افزودن یادبود» — creates a memorial profile skeleton.
 *
 * Unlike a square or collective, a یادبود has no registering owner: the admin
 * supplies everything, including the handle (left blank, it is generated from
 * the name — see `MemorialService::create`). The timeline and photo gallery
 * are deliberately not part of this form; they get their own editors on the
 * detail page once the memorial exists.
 */
export function AdminMemorialCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [biography, setBiography] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [status, setStatus] = useState<MemorialStatus>(DEFAULT_STATUS);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [created, setCreated] = useState<{ id: number; name: string } | null>(null);

  const input: MemorialCreateInput = useMemo(
    () => ({ name, handle, biography, birthDate, deathDate, avatarMediaId, coverMediaId, status }),
    [name, handle, biography, birthDate, deathDate, avatarMediaId, coverMediaId, status],
  );

  const submit = async () => {
    if (busy || uploadBusy) return;
    setFormError(null);
    setFieldErrors({});

    const validation = validate(input);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      setFormError("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setBusy(true);
    try {
      const result = await createMemorial(input);
      setCreated({ id: result.id, name: name || `یادبود #${result.id}` });
      router.refresh();
    } catch (reason) {
      const fields =
        reason && typeof reason === "object" && "fields" in reason
          ? (reason as { fields?: Record<string, string> }).fields
          : undefined;
      setFieldErrors(fieldMessages(fields));
      setFormError(adminErrorMessage(reason, "ساخت یادبود ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-full bg-background">
        <AdminPageHeader title="یادبود ساخته شد" crumbs={[{ label: "یادبودها", href: "/admin/memorials" }, { label: "افزودن یادبود" }]} />
        <div className="px-3 py-4 sm:px-4">
          <AdminNotice
            tone="success"
            message={`«${created.name}» ساخته شد. برای افزودن تایم‌لاین و قاب‌های ماندگار وارد صفحه جزئیات شوید.`}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/memorials/${created.id}` as Route} className={primaryButtonClass}>
              مشاهده و تکمیل یادبود
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setName("");
                setHandle("");
                setBiography("");
                setBirthDate("");
                setDeathDate("");
                setAvatarMediaId(null);
                setCoverMediaId(null);
              }}
              className={secondaryButtonClass}
            >
              افزودن یادبود دیگر
            </button>
            <Link href={"/admin/memorials" as Route} className={secondaryButtonClass}>
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
        title="افزودن یادبود"
        description="یادبود هیچ مالک ثبت‌کننده‌ای ندارد؛ همه مشخصات را خودتان وارد می‌کنید. بیوگرافی، تایم‌لاین و گالری بعداً از صفحه جزئیات کامل می‌شوند."
        crumbs={[{ label: "یادبودها", href: "/admin/memorials" }, { label: "افزودن یادبود" }]}
      />

      <AdminEditor
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {formError ? <div className="admin-form-notice"><AdminNotice tone="error" message={formError} onDismiss={() => setFormError(null)} /></div> : null}

        <section aria-label="مشخصات یادبود" className="admin-form-card admin-form-main space-y-4">
          <h2>مشخصات یادبود</h2>

          <AdminField label="نام" htmlFor="memorial-name" required error={fieldErrors.name} hint="نام کامل فردی که این یادبود برای او ساخته می‌شود.">
            <input id="memorial-name" value={name} aria-invalid={fieldErrors.name ? true : undefined} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </AdminField>

          <AdminField label="شناسه کاربری" htmlFor="memorial-handle" error={fieldErrors.handle} hint="اختیاری؛ اگر خالی بماند از نام ساخته می‌شود.">
            <HandleInput id="memorial-handle" value={handle} onChange={setHandle} required={false} serverError={fieldErrors.handle} inputClassName={fieldClass} />
          </AdminField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="تاریخ تولد" htmlFor="memorial-birth" error={fieldErrors.birth_date} hint="هر قالبی که در دسترس است، مثلاً فقط سال.">
              <input id="memorial-birth" dir="ltr" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={`${fieldClass} text-left`} />
            </AdminField>
            <AdminField label="تاریخ درگذشت" htmlFor="memorial-death" error={fieldErrors.death_date}>
              <input id="memorial-death" dir="ltr" value={deathDate} onChange={(event) => setDeathDate(event.target.value)} className={`${fieldClass} text-left`} />
            </AdminField>
          </div>

          <AdminField label="وضعیت انتشار" htmlFor="memorial-status">
            <select id="memorial-status" value={status} onChange={(event) => setStatus(event.target.value as MemorialStatus)} className={fieldClass}>
              {MEMORIAL_STATUSES.map((value) => (
                <option key={value} value={value}>{MEMORIAL_STATUS_LABELS[value]}</option>
              ))}
            </select>
          </AdminField>
        </section>

        <section aria-label="بیوگرافی" className="admin-form-card admin-form-wide space-y-3">
          <h2>بیوگرافی</h2>
          <p className="text-[10px] leading-5 text-muted-foreground">
            متن کامل زندگی‌نامه به مارک‌داون؛ برخلاف توضیح کوتاه سایر حساب‌ها، این متن می‌تواند بلند باشد.
          </p>
          <AdminField label="بیوگرافی" htmlFor="memorial-biography" error={fieldErrors.biography}>
            <textarea id="memorial-biography" value={biography} rows={10} onChange={(event) => setBiography(event.target.value)} className={`${fieldClass} resize-y font-mono text-xs leading-7`} dir="auto" />
          </AdminField>
        </section>

        <section aria-label="تصاویر یادبود" className="admin-form-side space-y-4">
          <h2>تصاویر</h2>
          <MediaPickerField id="memorial-avatar" label="تصویر پروفایل" hint="تصویر چهره که در فهرست و پروفایل نمایش داده می‌شود." mediaId={avatarMediaId} onChange={setAvatarMediaId} onBusyChange={setUploadBusy} />
          <MediaPickerField id="memorial-cover" label="تصویر کاور" purpose="cover" mediaId={coverMediaId} onChange={setCoverMediaId} onBusyChange={setUploadBusy} />
        </section>

        <div className="admin-form-actions">
          <button type="submit" disabled={busy || uploadBusy} className={primaryButtonClass}>
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
            {busy ? "در حال ساخت…" : "ساخت یادبود"}
          </button>
          <Link href={"/admin/memorials" as Route} className={secondaryButtonClass}>
            انصراف
          </Link>
        </div>
      </AdminEditor>
    </div>
  );
}
