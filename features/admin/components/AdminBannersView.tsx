"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ContentBanner } from "@/features/content/services/banners.service";
import { fieldErrorMessage, MeydanApiError } from "@/lib/meydan-api";
import { saveAdminBanners } from "../services/banners.service";
import { adminErrorMessage } from "../services/admin-api";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminField, fieldClass } from "./AdminField";
import { MediaPickerField } from "./MediaPickerField";
import { secondaryButtonClass } from "./styles";

export function AdminBannersView({ initial }: { initial: ContentBanner[] }) {
  const [banners, setBanners] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const locked = busy || uploads.size > 0;

  const changed = () => { setMessage(""); setErrors({}); };
  const update = (id: string, patch: Partial<ContentBanner>) => {
    changed();
    setBanners((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  };
  const move = (index: number, offset: number) => {
    changed();
    setBanners((rows) => {
      const next = [...rows];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  };
  const save = async () => {
    setBusy(true); setMessage(""); setErrors({}); setFailed(false);
    try {
      setBanners(await saveAdminBanners(banners));
      setMessage("بنرها ذخیره شدند.");
    } catch (error) {
      setFailed(true);
      setMessage(adminErrorMessage(error, "ذخیره بنرها ممکن نشد."));
      if (error instanceof MeydanApiError) setErrors(error.fields ?? {});
    } finally { setBusy(false); }
  };

  return (
    <div dir="rtl">
      <AdminPageHeader title="بنرها" description="تصویر و لینک بنرهای بالای صفحه محتوا را مدیریت کنید. ترتیب فهرست، ترتیب نمایش است." crumbs={[{ label: "محتوا", href: "/admin/content" }, { label: "بنرها" }]} />
      <form className="space-y-4 p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); if (!locked) void save(); }}>
        {!banners.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">هنوز بنری اضافه نشده است. با افزودن اولین بنر شروع کنید.</p>}
        {banners.map((banner, index) => {
          const fieldError = (field: string) => errors[`banners.${index}.${field}`] ? fieldErrorMessage(errors[`banners.${index}.${field}`]) : undefined;
          return (
            <fieldset key={banner.id} disabled={busy} className="min-w-0 space-y-4 rounded-2xl border border-border bg-surface p-4">
              <legend className="px-2 text-sm font-bold">بنر {(index + 1).toLocaleString("fa-IR")}{banner.title ? ` — ${banner.title}` : ""}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaPickerField id={`banner-${banner.id}-image`} label="تصویر بنر" hint="نسبت پیشنهادی ۱٫۸ به ۱؛ مثلاً ۱۰۸۰ × ۶۰۰ پیکسل. تصاویر با نسبت دیگر از مرکز برش می‌خورند." purpose="cover" mediaId={banner.media_id} currentUrl={banner.image_url} disabled={busy} error={fieldError("media_id")} onChange={(media_id) => update(banner.id, { media_id, image_url: media_id === banner.media_id ? banner.image_url : null })} onBusyChange={(uploading) => setUploads((current) => { const next = new Set(current); if (uploading) next.add(banner.id); else next.delete(banner.id); return next; })} />
                <div className="space-y-4">
                  <AdminField label="عنوان بنر" htmlFor={`banner-${banner.id}-title`} error={fieldError("title")}>
                    <input id={`banner-${banner.id}-title`} required value={banner.title} onChange={(event) => update(banner.id, { title: event.target.value })} className={fieldClass} />
                  </AdminField>
                  <AdminField label="لینک مقصد" htmlFor={`banner-${banner.id}-href`} hint="مسیر داخلی مانند /content/123 یا لینک https://example.com" error={fieldError("href")}>
                    <input id={`banner-${banner.id}-href`} required value={banner.href} onChange={(event) => update(banner.id, { href: event.target.value })} className={fieldClass} dir="ltr" />
                  </AdminField>
                  <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={banner.enabled} onChange={(event) => update(banner.id, { enabled: event.target.checked })} />نمایش بنر در صفحه محتوا</label>
                </div>
              </div>
              {fieldError("id") || fieldError("enabled") ? <p role="alert" className="text-sm text-danger-foreground">اطلاعات بنر معتبر نیست؛ بنر را دوباره اضافه کنید.</p> : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={locked || index === 0} onClick={() => move(index, -1)} className={secondaryButtonClass} aria-label={`انتقال بنر ${index + 1} به بالا`}><ArrowUp size={16} />بالاتر</button>
                <button type="button" disabled={locked || index === banners.length - 1} onClick={() => move(index, 1)} className={secondaryButtonClass} aria-label={`انتقال بنر ${index + 1} به پایین`}><ArrowDown size={16} />پایین‌تر</button>
                <button type="button" disabled={locked} onClick={() => { changed(); setBanners((rows) => rows.filter((row) => row.id !== banner.id)); }} className={secondaryButtonClass} aria-label={`حذف بنر ${index + 1}`}><Trash2 size={16} />حذف</button>
              </div>
            </fieldset>
          );
        })}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={locked} className={secondaryButtonClass} onClick={() => { changed(); setBanners((rows) => [...rows, { id: globalThis.crypto?.randomUUID?.() ?? `banner-${Date.now()}-${Math.random().toString(36).slice(2)}`, media_id: null, image_url: null, title: "", href: "", enabled: true }]); }}><Plus size={16} />افزودن بنر</button>
          <button type="submit" disabled={locked} className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-brand-foreground disabled:opacity-50">{busy ? "در حال ذخیره…" : uploads.size ? "در حال بارگذاری تصویر…" : "ذخیره بنرها"}</button>
          <span className="text-xs text-muted-foreground">تغییرات با زدن دکمهٔ ذخیره اعمال می‌شوند.</span>
        </div>
        {message && <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-danger-foreground" : "text-sm text-foreground"}>{message}</p>}
      </form>
    </div>
  );
}
