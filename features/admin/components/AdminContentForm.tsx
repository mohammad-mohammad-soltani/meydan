"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Save } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { MediaPickerField } from "./MediaPickerField";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  createContent,
  updateContent,
} from "../services/content.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  CONTENT_FORMATS,
  CONTENT_FORMAT_LABELS,
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentFormat,
  type ContentInput,
  type ContentItem,
  type ContentStatus,
} from "../types";

function toInput(content?: ContentItem): ContentInput {
  return {
    title: content?.title ?? "",
    body: content?.body ?? "",
    excerpt: content?.excerpt ?? "",
    // Editing pre-fills the only status this form can be reached for: the
    // detail route only resolves published content, so re-saving without
    // touching the select must not silently unpublish it.
    status: "publish",
    format: (content?.format as ContentFormat) ?? "mixed",
    usageNote: content?.usageNote ?? "",
    subtitle: content?.subtitle ?? "",
    badge: content?.badge ?? "",
    locationLabel: content?.locationLabel ?? "",
    mediaDuration: content?.mediaDuration ?? "",
    featured: content?.featured ?? false,
    attachments: (content?.attachments ?? []).map((attachment) => ({
      mediaId: attachment.mediaId,
      caption: attachment.caption ?? undefined,
      label: attachment.label ?? undefined,
    })),
    tags: content?.tags ?? [],
    category: content?.category?.id ?? null,
    creators: content?.creators ?? [],
  };
}

/**
 * Create/edit a content item.
 *
 * The one behaviour that shapes this form: `POST/PATCH /admin/content` answers
 * `data: null` whenever the saved post is **not** `publish`
 * (`Serializer::content` returns `null` for a non-published post). A saved
 * draft is therefore a success with no body — reading `data.id` blindly would
 * look like a failure, so the form never does.
 */
export function AdminContentForm({ content }: { content?: ContentItem }) {
  const router = useRouter();
  const mode = content ? "edit" : "create";

  const [form, setForm] = useState<ContentInput>(() => toInput(content));
  const [tagText, setTagText] = useState((content?.tags ?? []).join("، "));
  const [mediaId, setMediaId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [savedDraftNotice, setSavedDraftNotice] = useState(false);

  const patch = (next: Partial<ContentInput>) => setForm((current) => ({ ...current, ...next }));

  const submit = async () => {
    setMessage(null);
    setFieldErrors({});
    setSavedDraftNotice(false);

    if (!form.title.trim()) {
      setFieldErrors({ title: "عنوان الزامی است." });
      setMessage("چند فیلد نیاز به اصلاح دارد.");
      return;
    }
    if (!form.body.trim() && form.attachments.length === 0) {
      setMessage("متن یا حداقل یک ضمیمه لازم است؛ در غیر این صورت موردی برای ذخیره نیست.");
      return;
    }

    const payload: ContentInput = {
      ...form,
      tags: tagText
        .split(/[,،\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    setBusy(true);
    try {
      const result =
        mode === "edit" && content
          ? await updateContent(String(content.id), payload)
          : await createContent(payload);

      if (result) {
        router.push(`/admin/content/${result.id}` as Route);
        router.refresh();
        return;
      }

      // A non-published save: the API wrote the row but sent no payload.
      setSavedDraftNotice(true);
      setMessage(
        payload.status === "publish"
          ? "محتوا ذخیره شد."
          : `محتوا با وضعیت «${CONTENT_STATUS_LABELS[payload.status]}» ذخیره شد. برای دیدن آن از پیشخوان وردپرس استفاده کنید؛ این فهرست فقط موارد منتشرشده را نشان می‌دهد.`,
      );
      router.refresh();
    } catch (reason) {
      const fields =
        reason && typeof reason === "object" && "fields" in reason
          ? (reason as { fields?: Record<string, string> }).fields
          : undefined;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(fields ?? {}).map(([key, value]) => [key, fieldErrorMessage(value)]),
        ),
      );
      setMessage(adminErrorMessage(reason, "ذخیره محتوا ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="admin-form-notice"><AdminFieldMessage message={message} fields={fieldErrors} tone={savedDraftNotice ? "success" : "error"} /></div>

      <section aria-label="متن اصلی" className="admin-form-card admin-form-main space-y-4">
        <h2>متن اصلی</h2>

        <AdminField label="عنوان" htmlFor="content-title" required error={fieldErrors.title}>
          <input
            id="content-title"
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
            className={fieldClass}
          />
        </AdminField>

        <AdminField label="متن کامل" htmlFor="content-body" error={fieldErrors.body}>
          <textarea
            id="content-body"
            value={form.body}
            rows={8}
            onChange={(event) => patch({ body: event.target.value })}
            className={`${fieldClass} resize-y`}
          />
        </AdminField>

        <AdminField label="خلاصه" htmlFor="content-excerpt" error={fieldErrors.excerpt}>
          <textarea
            id="content-excerpt"
            value={form.excerpt}
            rows={2}
            onChange={(event) => patch({ excerpt: event.target.value })}
            className={`${fieldClass} resize-none`}
          />
        </AdminField>

      </section>

      <section aria-label="دسته‌بندی و وضعیت" className="admin-form-card admin-form-side space-y-4">
        <h2>انتشار و دسته‌بندی</h2>

        <div className="space-y-3">
          <AdminField label="قالب" htmlFor="content-format" error={fieldErrors.format}>
            <select
              id="content-format"
              value={form.format}
              onChange={(event) => patch({ format: event.target.value as ContentFormat })}
              className={fieldClass}
            >
              {CONTENT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {CONTENT_FORMAT_LABELS[format]}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField
            label="وضعیت انتشار"
            htmlFor="content-status"
            error={fieldErrors.status}
            hint="برای پیش‌نویس، بدنه پاسخ خالی برمی‌گردد."
          >
            <select
              id="content-status"
              value={form.status}
              onChange={(event) => patch({ status: event.target.value as ContentStatus })}
              className={fieldClass}
            >
              {CONTENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField
            label="شناسه دسته‌بندی"
            htmlFor="content-category"
            error={fieldErrors.category}
            hint="شناسه عددی ترم دسته‌بندی محتوا؛ خالی بگذارید تا دسته‌ای تنظیم نشود."
          >
            <input
              id="content-category"
              value={form.category ?? ""}
              inputMode="numeric"
              onChange={(event) =>
                patch({ category: event.target.value === "" ? null : Number(event.target.value) })
              }
              className={fieldClass}
            />
          </AdminField>

        </div>

        <AdminCheckbox
          id="content-featured"
          label="محتوا ویژه"
          description="در فهرست عمومی با نشان ویژه نمایش داده می‌شود."
          checked={form.featured}
          onChange={(featured) => patch({ featured })}
        />
      </section>

      <section aria-label="ضمیمه‌ها" className="admin-form-card admin-form-main space-y-4">
        <h2>ضمیمه‌ها</h2>
        <p className="text-[10px] leading-5 text-muted-foreground">
          هر ضمیمه یک شناسه رسانه است. ترتیب فهرست، ترتیب نمایش را تعیین می‌کند.
        </p>

        <MediaPickerField
          id="content-attachment"
          label="افزودن رسانه"
          purpose="narrative"
          mediaId={mediaId}
          onChange={setMediaId}
        />

        <button
          type="button"
          disabled={!mediaId}
          onClick={() => {
            if (!mediaId) return;
            patch({ attachments: [...form.attachments, { mediaId }] });
            setMediaId(null);
          }}
          className={`${secondaryButtonClass} min-h-9`}
        >
          افزودن به فهرست ضمیمه‌ها
        </button>

        {form.attachments.length > 0 ? (
          <ul className="divide-y divide-divider rounded-control border border-border">
            {form.attachments.map((attachment, index) => (
              <li key={`${attachment.mediaId}-${index}`} className="flex items-center gap-2 px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  #{attachment.mediaId}
                </span>
                <input
                  value={attachment.caption ?? ""}
                  aria-label={`توضیح ضمیمه ${index + 1}`}
                  onChange={(event) =>
                    patch({
                      attachments: form.attachments.map((item, position) =>
                        position === index ? { ...item, caption: event.target.value } : item,
                      ),
                    })
                  }
                  placeholder="توضیح"
                  className={`${fieldClass} mt-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      attachments: form.attachments.filter((_, position) => position !== index),
                    })
                  }
                  className="shrink-0 text-[10px] font-black text-danger-foreground"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-control border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
            هنوز ضمیمه‌ای اضافه نشده است.
          </p>
        )}
      </section>

      <AdminDisclosureSection title="جزئیات کارت و برچسب‌ها" className="admin-form-side" hasError={Boolean(fieldErrors.tags || fieldErrors.badge || fieldErrors.subtitle || fieldErrors.location_label || fieldErrors.media_duration)}>
        <div className="space-y-3">
          <AdminField label="برچسب‌ها" htmlFor="content-tags" error={fieldErrors.tags} hint="با ویرگول یا خط جدید جدا کنید.">
            <textarea id="content-tags" value={tagText} rows={2} onChange={(event) => setTagText(event.target.value)} className={`${fieldClass} resize-none`} />
          </AdminField>
          <AdminField label="برچسب روی کارت" htmlFor="content-badge" error={fieldErrors.badge}>
            <input id="content-badge" value={form.badge} onChange={(event) => patch({ badge: event.target.value })} className={fieldClass} />
          </AdminField>
          <AdminField label="زیرعنوان" htmlFor="content-subtitle" error={fieldErrors.subtitle}>
            <input id="content-subtitle" value={form.subtitle} onChange={(event) => patch({ subtitle: event.target.value })} className={fieldClass} />
          </AdminField>
          <AdminField label="محل" htmlFor="content-location" error={fieldErrors.location_label}>
            <input id="content-location" value={form.locationLabel} onChange={(event) => patch({ locationLabel: event.target.value })} className={fieldClass} />
          </AdminField>
          <AdminField label="مدت رسانه" htmlFor="content-duration" error={fieldErrors.media_duration}>
            <input id="content-duration" value={form.mediaDuration} dir="ltr" placeholder="12:30" onChange={(event) => patch({ mediaDuration: event.target.value })} className={`${fieldClass} text-left`} />
          </AdminField>
        </div>
      </AdminDisclosureSection>

      <AdminDisclosureSection title="تولیدکنندگان" className="admin-form-wide" hasError={Boolean(fieldErrors.creators)}>
        <p className="text-[10px] leading-5 text-muted-foreground">
          شناسه تولیدکننده‌ها به‌همراه برچسب نقش. ترتیب فهرست، ترتیب نمایش است.
        </p>
        {form.creators.map((creator, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
            <input
              value={creator.id}
              inputMode="numeric"
              aria-label={`شناسه تولیدکننده ${index + 1}`}
              onChange={(event) =>
                patch({
                  creators: form.creators.map((item, position) =>
                    position === index ? { ...item, id: Number(event.target.value) } : item,
                  ),
                })
              }
              className={fieldClass}
            />
            <input
              value={creator.roleLabel}
              aria-label={`نقش تولیدکننده ${index + 1}`}
              onChange={(event) =>
                patch({
                  creators: form.creators.map((item, position) =>
                    position === index ? { ...item, roleLabel: event.target.value } : item,
                  ),
                })
              }
              placeholder="نقش (مثلاً تصویربردار)"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() =>
                patch({ creators: form.creators.filter((_, position) => position !== index) })
              }
              className="mt-1.5 shrink-0 rounded-control border border-border px-3 text-[10px] font-black text-danger-foreground"
            >
              حذف
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({
              creators: [
                ...form.creators,
                { id: 0, position: form.creators.length, roleLabel: "" },
              ],
            })
          }
          className={`${secondaryButtonClass} min-h-9`}
        >
          افزودن تولیدکننده
        </button>
      </AdminDisclosureSection>

      <div className="admin-form-actions">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="h-4 w-4" />
          )}
          {busy ? "در حال ذخیره…" : mode === "create" ? "ساخت محتوا" : "ذخیره تغییرات"}
        </button>
        <Link href={"/admin/content" as Route} className={secondaryButtonClass}>
          بازگشت به فهرست
        </Link>
      </div>
    </form>
  );
}
