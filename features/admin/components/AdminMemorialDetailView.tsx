"use client";

import { HandleInput } from "@/components/shared/HandleInput";
import { AdminEditor } from "./AdminEditor";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { OptimizedAvatar } from "@/components/shared/OptimizedAvatar";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Flower2,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminCheckbox, AdminField, fieldClass } from "./AdminField";
import { AdminNotice } from "./AdminNotice";
import { AdminSuccessToast } from "./AdminSuccessToast";
import { AdminPageHeader } from "./AdminPageHeader";
import { MediaPickerField } from "./MediaPickerField";
import { PostStatusBadge, VerifiedBadge } from "./AdminStatusBadge";
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  addMemorialFrame,
  adminErrorMessage,
  deleteMemorial,
  removeMemorialFrame,
  reorderMemorialFrames,
  setMemorialTimeline,
  updateMemorial,
  updateMemorialFrame,
} from "../services/memorials.service";
import { fieldErrorMessage } from "@/lib/meydan-api";
import {
  MEMORIAL_STATUSES,
  MEMORIAL_STATUS_LABELS,
  type Memorial,
  type MemorialFrame,
  type MemorialStatus,
  type MemorialTimelineEvent,
  type MemorialUpdateInput,
} from "../types";

function reasonMessages(fields?: Record<string, string>): Record<string, string> {
  if (!fields) return {};
  return Object.fromEntries(Object.entries(fields).map(([key, reason]) => [key, fieldErrorMessage(reason)]));
}

type ProfileFormState = {
  name: string;
  handle: string;
  biography: string;
  birthDate: string;
  deathDate: string;
  status: MemorialStatus;
  verified: boolean;
  avatarMediaId: number | null;
  coverMediaId: number | null;
};

function toFormState(memorial: Memorial): ProfileFormState {
  return {
    name: memorial.name,
    handle: memorial.handle,
    biography: memorial.biography,
    birthDate: memorial.birthDate,
    deathDate: memorial.deathDate,
    status: memorial.postStatus,
    verified: memorial.verified,
    avatarMediaId: null,
    coverMediaId: null,
  };
}

function buildUpdate(form: ProfileFormState): MemorialUpdateInput {
  return {
    name: form.name,
    handle: form.handle,
    biography: form.biography,
    birthDate: form.birthDate,
    deathDate: form.deathDate,
    status: form.status,
    verified: form.verified,
    avatarMediaId: form.avatarMediaId,
    coverMediaId: form.coverMediaId,
  };
}

function newLocalId(): string {
  return Math.random().toString(36).slice(2, 12);
}

/**
 * یادبود detail: profile + biography (one PATCH), then the two
 * memorial-specific objects that live on their own endpoints —
 * the life timeline (`PUT .../timeline`, full-array replace) and the photo
 * gallery (`POST/PATCH/DELETE .../frames`, one call per change).
 */
export function AdminMemorialDetailView({ memorial: initial }: { memorial: Memorial }) {
  const router = useRouter();
  const [memorial, setMemorial] = useState(initial);
  const [form, setForm] = useState<ProfileFormState>(() => toFormState(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saved, setSaved] = useState<{ id: number; message: string } | null>(null);

  const [timeline, setTimeline] = useState<MemorialTimelineEvent[]>(initial.timeline);
  const [timelineBusy, setTimelineBusy] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const [frames, setFrames] = useState<MemorialFrame[]>(initial.frames);
  const [framesError, setFramesError] = useState<string | null>(null);
  const [frameBusyId, setFrameBusyId] = useState<number | null>(null);
  const [pendingFrameMediaId, setPendingFrameMediaId] = useState<number | null>(null);
  const [frameUploadBusy, setFrameUploadBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const save = async () => {
    if (saving || uploadBusy) return;
    setFieldErrors({});
    setFormError(null);
    setSaved(null);

    if (!form.name.trim()) {
      setFieldErrors({ name: "نام یادبود الزامی است." });
      setFormError("چند فیلد نیاز به اصلاح دارد.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMemorial(String(memorial.id), buildUpdate(form));
      setMemorial(updated);
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

  /* ---------------------------------------------------------- timeline */

  const addTimelineEvent = () => {
    setTimeline((current) => [
      ...current,
      { id: newLocalId(), date: "", title: "", description: "", photoMediaId: null, order: current.length + 1 },
    ]);
  };

  const updateTimelineEvent = (id: string, patch: Partial<MemorialTimelineEvent>) => {
    setTimeline((current) => current.map((event) => (event.id === id ? { ...event, ...patch } : event)));
  };

  const removeTimelineEvent = (id: string) => {
    setTimeline((current) => current.filter((event) => event.id !== id));
  };

  const moveTimelineEvent = (index: number, direction: -1 | 1) => {
    setTimeline((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const saveTimeline = async () => {
    if (timelineBusy) return;
    setTimelineBusy(true);
    setTimelineError(null);
    try {
      const missingTitle = timeline.some((event) => !event.title.trim());
      if (missingTitle) {
        setTimelineError("عنوان هر رویداد الزامی است.");
        return;
      }
      setTimeline(await setMemorialTimeline(String(memorial.id), timeline));
      setSaved({ id: Date.now(), message: "تایم‌لاین ذخیره شد." });
    } catch (reason) {
      setTimelineError(adminErrorMessage(reason, "ذخیره تایم‌لاین ممکن نشد."));
    } finally {
      setTimelineBusy(false);
    }
  };

  /* ------------------------------------------------------------ frames */

  const addFrame = async () => {
    if (!pendingFrameMediaId || frameUploadBusy) return;
    setFramesError(null);
    try {
      setFrames(await addMemorialFrame(String(memorial.id), pendingFrameMediaId));
      setPendingFrameMediaId(null);
    } catch (reason) {
      setFramesError(adminErrorMessage(reason, "افزودن تصویر ممکن نشد."));
    }
  };

  const saveFrameCaption = async (frame: MemorialFrame, patch: { caption?: string; label?: string }) => {
    setFrameBusyId(frame.mediaId);
    setFramesError(null);
    try {
      setFrames(await updateMemorialFrame(String(memorial.id), frame.mediaId, patch));
    } catch (reason) {
      setFramesError(adminErrorMessage(reason, "ذخیره توضیح تصویر ممکن نشد."));
    } finally {
      setFrameBusyId(null);
    }
  };

  const deleteFrame = async (frame: MemorialFrame) => {
    setFrameBusyId(frame.mediaId);
    setFramesError(null);
    try {
      setFrames(await removeMemorialFrame(String(memorial.id), frame.mediaId));
    } catch (reason) {
      setFramesError(adminErrorMessage(reason, "حذف تصویر ممکن نشد."));
    } finally {
      setFrameBusyId(null);
    }
  };

  const moveFrame = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= frames.length) return;
    const next = [...frames];
    [next[index], next[target]] = [next[target], next[index]];
    setFramesError(null);
    try {
      setFrames(await reorderMemorialFrames(String(memorial.id), next.map((frame) => frame.mediaId)));
    } catch (reason) {
      setFramesError(adminErrorMessage(reason, "تغییر ترتیب تصاویر ممکن نشد."));
    }
  };

  /* ------------------------------------------------------------ delete */

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteMemorial(String(memorial.id));
      router.push("/admin/memorials" as Route);
      router.refresh();
    } catch (reason) {
      setDeleteError(adminErrorMessage(reason, "حذف یادبود ممکن نشد."));
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={memorial.name || `یادبود #${memorial.id}`}
        description={memorial.birthDate || memorial.deathDate ? `${memorial.birthDate || "—"} – ${memorial.deathDate || "—"}` : undefined}
        crumbs={[{ label: "یادبودها", href: "/admin/memorials" }, { label: memorial.name || `#${memorial.id}` }]}
      />

      <AdminEditor title="ویرایش یادبود" onSubmit={(event) => event.preventDefault()}>
        {formError ? <div className="admin-form-notice"><AdminNotice tone="error" message={formError} onDismiss={() => setFormError(null)} /></div> : null}

        <section aria-label="خلاصه یادبود" className="admin-form-card admin-form-wide">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-muted text-icon-muted">
              {memorial.avatarUrl ? (
                <OptimizedAvatar src={memorial.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 object-cover" />
              ) : (
                <Flower2 aria-hidden="true" className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <PostStatusBadge status={memorial.postStatus} />
                <VerifiedBadge verified={memorial.verified} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                شناسه یادبود #{memorial.id}
                {memorial.ownerUserId ? ` · حساب داخلی #${memorial.ownerUserId}` : ""}
              </p>
            </div>
          </div>
        </section>

        <section aria-label="مشخصات یادبود" className="admin-form-card admin-form-wide space-y-4">
          <h2>مشخصات یادبود</h2>

          <AdminField label="نام" htmlFor="detail-memorial-name" required error={fieldErrors.name}>
            <input id="detail-memorial-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} />
          </AdminField>

          <AdminField label="شناسه کاربری" htmlFor="detail-memorial-handle" error={fieldErrors.handle} hint="بدون @؛ در همه‌جا با @ نمایش داده می‌شود.">
            <HandleInput
              id="detail-memorial-handle"
              value={form.handle}
              onChange={(handle) => setForm({ ...form, handle })}
              exceptUserId={memorial.ownerUserId}
              required={false}
              serverError={fieldErrors.handle}
              inputClassName={fieldClass}
            />
          </AdminField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="تاریخ تولد" htmlFor="detail-memorial-birth" error={fieldErrors.birth_date}>
              <input id="detail-memorial-birth" dir="ltr" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} className={`${fieldClass} text-left`} />
            </AdminField>
            <AdminField label="تاریخ درگذشت" htmlFor="detail-memorial-death" error={fieldErrors.death_date}>
              <input id="detail-memorial-death" dir="ltr" value={form.deathDate} onChange={(event) => setForm({ ...form, deathDate: event.target.value })} className={`${fieldClass} text-left`} />
            </AdminField>
          </div>

          <AdminField label="وضعیت انتشار" htmlFor="detail-memorial-status">
            <select id="detail-memorial-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MemorialStatus })} className={fieldClass}>
              {MEMORIAL_STATUSES.map((value) => (
                <option key={value} value={value}>{MEMORIAL_STATUS_LABELS[value]}</option>
              ))}
            </select>
          </AdminField>

          <AdminCheckbox id="detail-memorial-verified" label="تأییدشده" description="نشان تیک آبی روی نمایه نمایش داده می‌شود." checked={form.verified} onChange={(verified) => setForm({ ...form, verified })} />
        </section>

        <section aria-label="بیوگرافی" className="admin-form-card admin-form-wide space-y-3">
          <h2>بیوگرافی</h2>
          <p className="text-[10px] leading-5 text-muted-foreground">
            متن کامل زندگی‌نامه به مارک‌داون؛ برخلاف توضیح کوتاه سایر حساب‌ها، این متن می‌تواند بلند باشد.
          </p>
          <AdminField label="بیوگرافی" htmlFor="detail-memorial-biography">
            <textarea id="detail-memorial-biography" value={form.biography} rows={12} onChange={(event) => setForm({ ...form, biography: event.target.value })} className={`${fieldClass} resize-y font-mono text-xs leading-7`} dir="auto" />
          </AdminField>
        </section>

        <section aria-label="تصاویر یادبود" className="admin-form-side space-y-4">
          <h2>تصاویر</h2>
          <MediaPickerField id="detail-memorial-avatar" label="تغییر تصویر پروفایل" hint="اگر فایلی انتخاب نکنید، تصویر فعلی دست‌نخورده می‌ماند." mediaId={form.avatarMediaId} currentUrl={memorial.avatarUrl} onChange={(mediaId) => setForm((current) => ({ ...current, avatarMediaId: mediaId }))} onBusyChange={setUploadBusy} />
          <MediaPickerField id="detail-memorial-cover" label="تغییر تصویر کاور" purpose="cover" mediaId={form.coverMediaId} currentUrl={memorial.coverUrl} onChange={(mediaId) => setForm((current) => ({ ...current, coverMediaId: mediaId }))} onBusyChange={setUploadBusy} />
        </section>

        <div className="admin-form-actions">
          <button type="button" onClick={() => void save()} disabled={saving || uploadBusy} className={primaryButtonClass}>
            {saving ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
          <Link href={"/admin/memorials" as Route} className={secondaryButtonClass}>
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
            حذف یادبود
          </button>
        </div>

        <section aria-label="تایم‌لاین زندگی" className="admin-form-card admin-form-wide space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2>تایم‌لاین زندگی</h2>
              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                رویدادهای زندگی از تولد تا درگذشت، به ترتیبی که در اینجا چیده می‌شوند. ذخیره، کل فهرست را جای‌گزین می‌کند.
              </p>
            </div>
            <button type="button" onClick={addTimelineEvent} className={secondaryButtonClass}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              رویداد تازه
            </button>
          </div>

          {timelineError ? <AdminNotice tone="error" message={timelineError} onDismiss={() => setTimelineError(null)} /> : null}

          {timeline.length === 0 ? (
            <p className="rounded-control border border-border bg-surface-muted px-3 py-4 text-center text-xs text-muted-foreground">
              هنوز رویدادی ثبت نشده است.
            </p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((event, index) => (
                <li key={event.id} className="rounded-card border border-border bg-surface p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-muted-foreground">رویداد {(index + 1).toLocaleString("fa-IR")}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="انتقال به بالا" disabled={index === 0} onClick={() => moveTimelineEvent(index, -1)} className="grid h-8 w-8 place-items-center rounded-control border border-border text-foreground-secondary disabled:opacity-40">
                        <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="انتقال به پایین" disabled={index === timeline.length - 1} onClick={() => moveTimelineEvent(index, 1)} className="grid h-8 w-8 place-items-center rounded-control border border-border text-foreground-secondary disabled:opacity-40">
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="حذف رویداد" onClick={() => removeTimelineEvent(event.id)} className="grid h-8 w-8 place-items-center rounded-control border border-danger-border text-danger-foreground">
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-[minmax(0,10rem)_1fr]">
                    <AdminField label="تاریخ" htmlFor={`timeline-date-${event.id}`} hint="هر قالبی؛ مثلاً فقط سال.">
                      <input id={`timeline-date-${event.id}`} dir="ltr" value={event.date} onChange={(e) => updateTimelineEvent(event.id, { date: e.target.value })} className={`${fieldClass} text-left`} />
                    </AdminField>
                    <AdminField label="عنوان" htmlFor={`timeline-title-${event.id}`} required>
                      <input id={`timeline-title-${event.id}`} value={event.title} onChange={(e) => updateTimelineEvent(event.id, { title: e.target.value })} className={fieldClass} />
                    </AdminField>
                  </div>
                  <AdminField label="توضیح" htmlFor={`timeline-desc-${event.id}`}>
                    <textarea id={`timeline-desc-${event.id}`} value={event.description} rows={2} onChange={(e) => updateTimelineEvent(event.id, { description: e.target.value })} className={`${fieldClass} resize-none`} />
                  </AdminField>
                </li>
              ))}
            </ol>
          )}

          <div>
            <button type="button" onClick={() => void saveTimeline()} disabled={timelineBusy} className={primaryButtonClass}>
              {timelineBusy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
              {timelineBusy ? "در حال ذخیره…" : "ذخیره تایم‌لاین"}
            </button>
          </div>
        </section>

        <section aria-label="قاب‌های ماندگار" className="admin-form-card admin-form-wide space-y-4">
          <div>
            <h2>قاب‌های ماندگار</h2>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              گالری تصاویر یادبود. هر تصویر به‌محض افزودن یا ویرایش ذخیره می‌شود؛ نیازی به دکمه ذخیره جدا نیست.
            </p>
          </div>

          {framesError ? <AdminNotice tone="error" message={framesError} onDismiss={() => setFramesError(null)} /> : null}

          {frames.length === 0 ? (
            <p className="rounded-control border border-border bg-surface-muted px-3 py-4 text-center text-xs text-muted-foreground">
              هنوز تصویری افزوده نشده است.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {frames.map((frame, index) => (
                <li key={frame.mediaId} className="rounded-card border border-border bg-surface p-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-control bg-surface-muted text-icon-muted">
                      {frame.url ? (
                        <OptimizedAvatar src={frame.url} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
                      ) : (
                        <ImagePlus aria-hidden="true" className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        placeholder="عنوان (مثلاً «کودکی»)"
                        value={frame.label}
                        onChange={(e) => setFrames((current) => current.map((f) => (f.mediaId === frame.mediaId ? { ...f, label: e.target.value } : f)))}
                        onBlur={(e) => void saveFrameCaption(frame, { label: e.target.value })}
                        className={`${fieldClass} mt-0 min-h-9 text-xs`}
                      />
                      <input
                        placeholder="توضیح کوتاه"
                        value={frame.caption}
                        onChange={(e) => setFrames((current) => current.map((f) => (f.mediaId === frame.mediaId ? { ...f, caption: e.target.value } : f)))}
                        onBlur={(e) => void saveFrameCaption(frame, { caption: e.target.value })}
                        className={`${fieldClass} mt-0 min-h-9 text-xs`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {frameBusyId === frame.mediaId ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                    <button type="button" aria-label="انتقال به بالا" disabled={index === 0} onClick={() => void moveFrame(index, -1)} className="grid h-8 w-8 place-items-center rounded-control border border-border text-foreground-secondary disabled:opacity-40">
                      <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="انتقال به پایین" disabled={index === frames.length - 1} onClick={() => void moveFrame(index, 1)} className="grid h-8 w-8 place-items-center rounded-control border border-border text-foreground-secondary disabled:opacity-40">
                      <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="حذف تصویر" onClick={() => void deleteFrame(frame)} className="grid h-8 w-8 place-items-center rounded-control border border-danger-border text-danger-foreground">
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-card border border-dashed border-border p-3 space-y-2.5">
            <MediaPickerField id="memorial-frame-upload" label="تصویر تازه" mediaId={pendingFrameMediaId} onChange={setPendingFrameMediaId} onBusyChange={setFrameUploadBusy} />
            <button type="button" disabled={!pendingFrameMediaId || frameUploadBusy} onClick={() => void addFrame()} className={secondaryButtonClass}>
              <Check aria-hidden="true" className="h-4 w-4" />
              افزودن به گالری
            </button>
          </div>
        </section>
      </AdminEditor>

      {saved ? <AdminSuccessToast key={saved.id} message={saved.message} /> : null}

      {deleteOpen ? (
        <AdminDialog
          title="حذف یادبود"
          description={`«${memorial.name}» برای همیشه حذف می‌شود؛ این عملیات قابل بازگشت نیست.`}
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
