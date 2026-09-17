"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, Save, Trash2, Users } from "lucide-react";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminDialog } from "./AdminDialog";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { ScheduleRows } from "./ScheduleRows";
import { IdLookup, type LookupResult } from "./IdLookup";
import { primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  createProgram,
  deleteProgram,
  updateProgram,
  type ProgramKind,
} from "../services/programs.service";
import { searchNarratives } from "../services/narratives.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  PROGRAM_POST_STATUSES,
  PROGRAM_STATUSES,
  PROGRAM_STATUS_LABELS,
  type Program,
  type ProgramInput,
  type ProgramPostStatus,
  type ProgramScheduleRow,
  type ProgramStatus,
} from "../types";

const POST_STATUS_LABELS: Record<ProgramPostStatus, string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  pending: "در انتظار بازبینی",
  future: "زمان‌بندی‌شده",
};

function toInput(program?: Program): ProgramInput {
  return {
    title: program?.title ?? "",
    description: program?.description ?? "",
    ctaLabel: program?.ctaLabel ?? "",
    startsAt: program?.startsAt ?? "",
    endsAt: program?.endsAt ?? "",
    status: (program?.status as ProgramStatus) ?? "draft",
    allowGuestJoin: program?.allowGuestJoin ?? false,
    labels: program?.labels ?? [],
    linkedContent: program?.linkedContent ?? [],
    schedule: program?.schedule ?? [],
    order: program?.order ?? 0,
    postStatus: (program?.postStatus as ProgramPostStatus) ?? "publish",
  };
}

/**
 * Create/edit an initiative or a campaign.
 *
 * The two CPTs share this component because they share the controller; the only
 * structural difference is `allow_guest_join`, which the campaign branch ignores
 * — so the checkbox is only rendered for initiatives, and `programBody` drops the
 * key for campaigns for the same reason.
 *
 * `post_status` is separate from the plugin's own `status`: the first is the
 * WordPress visibility and is coerced to `publish` when unrecognised, the second
 * is the lifecycle the public page displays.
 */
export function AdminProgramForm({ kind, program }: { kind: ProgramKind; program?: Program }) {
  const router = useRouter();
  const mode = program ? "edit" : "create";
  const isInitiative = kind === "initiatives";
  const singular = isInitiative ? "ابتکار" : "کمپین";
  const listHref = `/admin/${kind}`;

  const [form, setForm] = useState<ProgramInput>(() => toInput(program));
  const [labelText, setLabelText] = useState((program?.labels ?? []).join("، "));
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contentLookupOpen, setContentLookupOpen] = useState(false);

  const patch = (next: Partial<ProgramInput>) => setForm((current) => ({ ...current, ...next }));

  const submit = async () => {
    setMessage(null);
    setFieldErrors({});
    if (!form.title.trim()) {
      setFieldErrors({ title: "عنوان الزامی است." });
      setMessage("چند فیلد نیاز به اصلاح دارد.");
      return;
    }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      setMessage("تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.");
      return;
    }

    const payload: ProgramInput = {
      ...form,
      labels: labelText
        .split(/[,،\n]/)
        .map((label) => label.trim())
        .filter(Boolean),
    };

    setBusy(true);
    try {
      const saved =
        mode === "edit" && program
          ? await updateProgram(kind, String(program.id), payload)
          : await createProgram(kind, payload);
      router.push(`${listHref}/${saved.id}` as Route);
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
      setMessage(adminErrorMessage(reason, `ذخیره ${singular} ممکن نشد.`));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setDeleteError(null);
    try {
      await deleteProgram(kind, String(program?.id));
      router.push(listHref as Route);
      router.refresh();
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, `حذف ${singular} ممکن نشد.`));
      setBusy(false);
    }
  };

  const updateSchedule = (rows: ProgramScheduleRow[]) => patch({ schedule: rows });

  return (
    <>
      <form
        className="space-y-5 px-3 py-4 pb-24 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AdminFieldMessage message={message} fields={fieldErrors} />

        <section aria-label="اطلاعات اصلی" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">اطلاعات اصلی</h2>

          <AdminField label="عنوان" htmlFor="program-title" required error={fieldErrors.title}>
            <input
              id="program-title"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              className={fieldClass}
            />
          </AdminField>

          <AdminField label="توضیحات" htmlFor="program-description" error={fieldErrors.description}>
            <textarea
              id="program-description"
              value={form.description}
              rows={5}
              onChange={(event) => patch({ description: event.target.value })}
              className={`${fieldClass} resize-y`}
            />
          </AdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField
              label="وضعیت چرخه عمر"
              htmlFor="program-status"
              hint="وضعیت ناشناخته در سرور به پیش‌نویس تبدیل می‌شود."
            >
              <select
                id="program-status"
                value={form.status}
                onChange={(event) => patch({ status: event.target.value as ProgramStatus })}
                className={fieldClass}
              >
                {PROGRAM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROGRAM_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField
              label="وضعیت انتشار"
              htmlFor="program-post-status"
              hint="وضعیت وردپرس؛ مقدار ناشناخته به «منتشرشده» تبدیل می‌شود."
            >
              <select
                id="program-post-status"
                value={form.postStatus}
                onChange={(event) => patch({ postStatus: event.target.value as ProgramPostStatus })}
                className={fieldClass}
              >
                {PROGRAM_POST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {POST_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField label="برچسب دکمه" htmlFor="program-cta" error={fieldErrors.cta_label}>
              <input
                id="program-cta"
                value={form.ctaLabel}
                onChange={(event) => patch({ ctaLabel: event.target.value })}
                className={fieldClass}
              />
            </AdminField>

            <AdminField
              label="ترتیب"
              htmlFor="program-order"
              hint="عدد کوچک‌تر بالاتر نمایش داده می‌شود."
            >
              <input
                id="program-order"
                value={form.order}
                inputMode="numeric"
                onChange={(event) => patch({ order: Number(event.target.value) || 0 })}
                className={fieldClass}
              />
            </AdminField>

            <AdminField
              label="شروع"
              htmlFor="program-starts"
              hint="میلادی، قالب YYYY-MM-DD HH:mm."
            >
              <input
                id="program-starts"
                value={form.startsAt}
                dir="ltr"
                placeholder="2026-09-17 09:00"
                onChange={(event) => patch({ startsAt: event.target.value })}
                className={`${fieldClass} text-left`}
              />
            </AdminField>

            <AdminField
              label="پایان"
              htmlFor="program-ends"
              hint="خالی بگذارید تا پایان‌یافته محسوب نشود."
            >
              <input
                id="program-ends"
                value={form.endsAt}
                dir="ltr"
                placeholder="2026-12-31 23:59"
                onChange={(event) => patch({ endsAt: event.target.value })}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
          </div>

          <AdminField label="برچسب‌ها" htmlFor="program-labels" hint="با ویرگول جدا کنید.">
            <textarea
              id="program-labels"
              value={labelText}
              rows={2}
              onChange={(event) => setLabelText(event.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </AdminField>

          {isInitiative ? (
            <AdminCheckbox
              id="program-guest"
              label="اجازه عضویت مهمان"
              description="کاربران بدون حساب هم می‌توانند در ابتکار شرکت کنند."
              checked={form.allowGuestJoin}
              onChange={(allowGuestJoin) => patch({ allowGuestJoin })}
            />
          ) : null}
        </section>

        <section aria-label="برنامه زمانی" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">برنامه زمانی</h2>
          <ScheduleRows rows={form.schedule} onChange={updateSchedule} />
        </section>

        <section aria-label="محتوای پیوندشده" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">محتوای پیوندشده</h2>
          <p className="text-[10px] leading-5 text-muted-foreground">
            فقط شناسه محتوا ذخیره می‌شود؛ ترتیب فهرست همان ترتیب نمایش است.
          </p>

          {form.linkedContent.length === 0 ? (
            <p className="rounded-control border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
              محتوایی پیوند نشده است.
            </p>
          ) : (
            <ul className="divide-y divide-divider rounded-control border border-border">
              {form.linkedContent.map((contentId, index) => (
                <li key={contentId} className="flex items-center gap-2 px-3 py-2">
                  <Link
                    href={`/admin/content/${contentId}` as Route}
                    className="font-mono text-[10px] text-link"
                  >
                    #{contentId}
                  </Link>
                  <span className="flex-1" />
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      patch({
                        linkedContent: form.linkedContent.map((id, position) =>
                          position === index - 1
                            ? contentId
                            : position === index
                              ? form.linkedContent[index - 1]
                              : id,
                        ),
                      })
                    }
                    className="rounded-control border border-border px-2 py-0.5 text-[10px] text-foreground-secondary disabled:opacity-40"
                  >
                    بالا
                  </button>
                  <button
                    type="button"
                    disabled={index === form.linkedContent.length - 1}
                    onClick={() =>
                      patch({
                        linkedContent: form.linkedContent.map((id, position) =>
                          position === index + 1
                            ? contentId
                            : position === index
                              ? form.linkedContent[index + 1]
                              : id,
                        ),
                      })
                    }
                    className="rounded-control border border-border px-2 py-0.5 text-[10px] text-foreground-secondary disabled:opacity-40"
                  >
                    پایین
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patch({ linkedContent: form.linkedContent.filter((id) => id !== contentId) })
                    }
                    className="rounded-control border border-danger-border px-2 py-0.5 text-[10px] text-danger-foreground"
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              aria-label="افزودن شناسه محتوا"
              placeholder="شناسه محتوا"
              inputMode="numeric"
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const value = Number((event.target as HTMLInputElement).value);
                if (Number.isFinite(value) && value > 0 && !form.linkedContent.includes(value)) {
                  patch({ linkedContent: [...form.linkedContent, value] });
                  (event.target as HTMLInputElement).value = "";
                }
              }}
              className={`${fieldClass} mt-0 max-w-40`}
            />
            <button
              type="button"
              onClick={() => setContentLookupOpen((open) => !open)}
              className={`${secondaryButtonClass} min-h-9`}
            >
              {contentLookupOpen ? "بستن جست‌وجو" : "جست‌وجوی محتوا"}
            </button>
          </div>

          {contentLookupOpen ? (
            <div className="rounded-control border border-border bg-surface-muted p-3">
              <IdLookup
                id="program-content-lookup"
                label="یافتن محتوا"
                placeholder="شناسه محتوا"
                searchLabel="جست‌وجو در روایت‌ها"
                searchPlaceholder="بخشی از متن روایت"
                hint="پس از تبدیل روایت به محتوا، شناسه محتوا در کارگاه روایت نمایش داده می‌شود."
                onPick={(result: LookupResult) => {
                  if (!form.linkedContent.includes(result.id)) {
                    patch({ linkedContent: [...form.linkedContent, result.id] });
                  }
                  setContentLookupOpen(false);
                }}
                onSearch={async (query) =>
                  (await searchNarratives(query)).map((row) => ({
                    id: row.contentId ?? row.id,
                    title: row.title,
                    subtitle: row.contentId ? `محتوا #${row.contentId}` : "روایت بدون محتوا",
                  }))
                }
              />
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "در حال ذخیره…" : mode === "create" ? `ساخت ${singular}` : "ذخیره تغییرات"}
          </button>
          <Link href={listHref as Route} className={secondaryButtonClass}>
            بازگشت به فهرست
          </Link>
          {mode === "edit" && isInitiative ? (
            <Link
              href={`/admin/initiatives/${program?.id}/participants` as Route}
              className={secondaryButtonClass}
            >
              <Users aria-hidden="true" className="h-4 w-4" />
              شرکت‌کنندگان
            </Link>
          ) : null}
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-danger-foreground transition-colors hover:opacity-90"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف
            </button>
          ) : null}
        </div>
      </form>

      {deleteOpen ? (
        <AdminDialog
          title={`حذف ${singular}`}
          description={`«${program?.title}» به زباله‌دان منتقل می‌شود. این حذف نرم است و قابل بازگردانی است.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={busy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
