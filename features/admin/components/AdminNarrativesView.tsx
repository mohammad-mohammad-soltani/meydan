"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { BookOpen, FileText, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminDisclosureSection } from "./AdminDisclosureSection";
import { AdminEmptyState, AdminErrorState } from "./AdminStateViews";
import { AdminField, fieldClass } from "./AdminField";
import { AdminFieldMessage } from "./AdminFieldMessage";
import { IdLookup, type LookupResult } from "./IdLookup";
import { MediaPickerField } from "./MediaPickerField";
import { PersianDatePicker } from "@/components/shared/PersianDatePicker";
import { formatAdminDate, splitAdminDateTime } from "../lib/datetime";
import { AdminPageHeader } from "./AdminPageHeader";
import { fa, primaryButtonClass, secondaryButtonClass } from "./styles";
import {
  adminErrorMessage,
  convertNarrativeToContent,
  deleteMediaReflection,
  getEditorialNarratives,
  getMediaReflections,
  getNarrative,
  removeNarrativeContent,
  searchNarratives,
  setEditorial,
  createMediaReflection,
  updateMediaReflection,
} from "../services/narratives.service";
import { getMediaOutlets } from "../services/creators.service";
import { getNoteCategories, type NoteCategoryOption } from "../services/note-categories.service";
import { CONTENT_FORMATS, CONTENT_FORMAT_LABELS, CONTENT_TYPES, CONTENT_TYPE_LABELS, type ContentFormat, type ContentType } from "../types";
import type { EditorialPage } from "../services/narratives.service";
import type { Narrative, MediaReflection, MediaOutlet } from "../types";

/**
 * کارگاه روایت — the narrative workshop.
 *
 * There is no admin narrative *list*: `GET /editorial/narratives` only returns
 * narratives already flagged for editorial, and `/explore/search` is the public
 * index. The screen therefore has three parts:
 *
 * 1. the editorial queue (with the mark/unmark toggle),
 * 2. a lookup that opens any narrative — by id or by public search,
 * 3. the opened narrative's actions: convert to content, or remove that link,
 *    plus its media reflections (بازتاب رسانه‌ای).
 *
 * Two asymmetries are surfaced in the UI rather than hidden: the
 * convert call needs a `format` (an empty one is a 422), and removing the
 * content link is not idempotent (a second call answers 404, treated here as
 * success).
 */
export function AdminNarrativesView({ initial }: { initial: EditorialPage }) {
  const [editorial, setEditorialPage] = useState(initial);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [reflections, setReflections] = useState<MediaReflection[]>([]);
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [convertOpen, setConvertOpen] = useState(false);
  const [format, setFormat] = useState<ContentFormat>("mixed");
  const [convertTitle, setConvertTitle] = useState("");
  const [convertCategory, setConvertCategory] = useState("");
  const [convertFeatured, setConvertFeatured] = useState(false);
  const [noteCategories, setNoteCategories] = useState<NoteCategoryOption[]>([]);
  const [contentType, setContentType] = useState<ContentType>("report");
  const [primaryAttachmentId, setPrimaryAttachmentId] = useState<number | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reflection editor state.
  const [outlets, setOutlets] = useState<MediaOutlet[]>([]);
  const [outletsLoaded, setOutletsLoaded] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState<MediaReflection | "new" | null>(null);
  const [refOutletId, setRefOutletId] = useState<number | null>(null);
  const [refOutlet, setRefOutlet] = useState("");
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refSummary, setRefSummary] = useState("");
  const [refPublishedAt, setRefPublishedAt] = useState("");
  const [refLogoMediaId, setRefLogoMediaId] = useState<number | null>(null);
  const [refBusy, setRefBusy] = useState(false);
  const [refMessage, setRefMessage] = useState<string | null>(null);
  const [pendingDeleteReflection, setPendingDeleteReflection] = useState<MediaReflection | null>(null);

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError(null);
    try {
      setEditorialPage(await getEditorialNarratives(1, 20));
    } catch (reason) {
      setQueueError(adminErrorMessage(reason, "دریافت صف سردبیری ممکن نشد."));
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  const openNarrative = useCallback(async (id: string) => {
    setLoadingNarrative(true);
    setNarrativeError(null);
    setNotice(null);
    try {
      const found = await getNarrative(id);
      if (!found) {
        setNarrative(null);
        setNarrativeError("روایتی با این شناسه پیدا نشد یا منتشر نشده است.");
        return;
      }
      setNarrative(found);
      setReflections(await getMediaReflections(id).catch(() => []));
    } catch (reason) {
      setNarrative(null);
      setNarrativeError(adminErrorMessage(reason, "باز کردن روایت ممکن نشد."));
    } finally {
      setLoadingNarrative(false);
    }
  }, []);

  const toggleEditorial = async (row: Narrative, next: boolean) => {
    setActionError(null);
    const previous = editorial;
    // Optimistic: the queue is long and the call is idempotent.
    setEditorialPage((current: EditorialPage) => ({
      ...current,
      items: next
        ? current.items.map((item) => (item.id === row.id ? { ...item, editorial: true } : item))
        : current.items.filter((item) => item.id !== row.id),
    }));
    if (narrative?.id === row.id) setNarrative({ ...narrative, editorial: next });

    try {
      await setEditorial(String(row.id), next);
      setNotice(next ? "روایت به صف سردبیری اضافه شد." : "روایت از صف سردبیری حذف شد.");
    } catch (reason) {
      setEditorialPage(previous);
      if (narrative?.id === row.id) setNarrative({ ...narrative, editorial: !next });
      setActionError(adminErrorMessage(reason, "تغییر وضعیت سردبیری ممکن نشد."));
    }
  };

  const doConvert = async () => {
    if (!narrative) return;
    if (!convertTitle.trim()) {
      setActionError("عنوان محتوا را بنویسید.");
      return;
    }
    if (narrative.attachments.length > 0 && !primaryAttachmentId) {
      setActionError("فایل اصلی محتوا را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await convertNarrativeToContent(String(narrative.id), contentType, format, primaryAttachmentId, contentType === "speech" ? { title: convertTitle.trim(), category: convertCategory, featured: convertFeatured } : { title: convertTitle.trim() });
      setConvertOpen(false);
      setNotice("روایت به محتوا تبدیل شد.");
      await openNarrative(String(narrative.id));
      await loadQueue();
    } catch (reason) {
      setActionError(adminErrorMessage(reason, "تبدیل روایت به محتوا ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const doRemoveContent = async () => {
    if (!narrative) return;
    setBusy(true);
    setActionError(null);
    try {
      await removeNarrativeContent(String(narrative.id));
      setRemoveOpen(false);
      setNotice("پیوند محتوا حذف شد.");
      await openNarrative(String(narrative.id));
    } catch (reason) {
      setActionError(adminErrorMessage(reason, "حذف پیوند محتوا ممکن نشد."));
    } finally {
      setBusy(false);
    }
  };

  const ensureOutlets = () => {
    if (outletsLoaded) return;
    setOutletsLoaded(true);
    void getMediaOutlets()
      .then((items) => setOutlets(items ?? []))
      .catch(() => setOutlets([]));
  };

  const openReflection = (reflection: MediaReflection | "new") => {
    ensureOutlets();
    setRefMessage(null);
    setRefLogoMediaId(null);
    if (reflection === "new") {
      setRefOutletId(null);
      setRefOutlet("");
      setRefTitle("");
      setRefUrl("");
      setRefSummary("");
      setRefPublishedAt("");
    } else {
      setRefOutletId(reflection.outletId || null);
      setRefOutlet(reflection.outletName);
      setRefTitle(reflection.title);
      setRefUrl(reflection.url);
      setRefSummary(reflection.summary);
      setRefPublishedAt(splitAdminDateTime(reflection.publishedAt).date);
    }
    setReflectionOpen(reflection);
  };

  const submitReflection = async () => {
    if (!narrative || !reflectionOpen) return;
    setRefMessage(null);
    if (!refTitle.trim() || !refUrl.trim()) {
      setRefMessage("عنوان و نشانی بازتاب الزامی است.");
      return;
    }

    setRefBusy(true);
    const payload = {
      outletId: refOutletId,
      outlet: refOutlet,
      title: refTitle,
      url: refUrl,
      summary: refSummary,
      logoMediaId: refLogoMediaId,
      publishedAt: refPublishedAt,
      status: "published",
      position: reflectionOpen === "new" ? reflections.length + 1 : reflectionOpen.position,
    };

    try {
      if (reflectionOpen === "new") {
        await createMediaReflection(String(narrative.id), payload);
      } else {
        await updateMediaReflection(reflectionOpen.id, payload);
      }
      setReflectionOpen(null);
      setReflections(await getMediaReflections(String(narrative.id)).catch(() => []));
    } catch (reason) {
      setRefMessage(adminErrorMessage(reason, "ذخیره بازتاب رسانه‌ای ممکن نشد."));
    } finally {
      setRefBusy(false);
    }
  };

  const confirmDeleteReflection = async () => {
    if (!pendingDeleteReflection || !narrative) return;
    setRefBusy(true);
    setRefMessage(null);
    try {
      await deleteMediaReflection(pendingDeleteReflection.id);
      setPendingDeleteReflection(null);
      setReflections(await getMediaReflections(String(narrative.id)).catch(() => []));
    } catch (reason) {
      setRefMessage(adminErrorMessage(reason, "حذف بازتاب ممکن نشد."));
    } finally {
      setRefBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="کارگاه روایت"
        description="سردبیری روایت‌ها، تبدیل روایت به محتوا و ثبت بازتاب رسانه‌ای."
        crumbs={[{ label: "کارگاه روایت" }]}
        limitation="فهرست روایت‌ها فقط موارد نشان‌خورده برای سردبیری را دارد؛ برای رسیدن به بقیه از جست‌وجوی شناسه استفاده کنید."
        actions={
          <button type="button" onClick={() => void loadQueue()} className={secondaryButtonClass}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loadingQueue ? "animate-spin" : ""}`} />
            بازخوانی صف
          </button>
        }
      />

      <div className="space-y-5 px-3 py-4 pb-24 sm:px-4">
        {notice ? (
          <p role="status" className="rounded-control border border-success-border bg-success-surface px-3 py-2.5 text-xs font-bold text-success-foreground">
            {notice}
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="rounded-control border border-danger-border bg-danger-surface px-3 py-2.5 text-xs font-bold text-danger-foreground">
            {actionError}
          </p>
        ) : null}

        <section aria-label="باز کردن روایت" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">باز کردن روایت</h2>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            روایت باید منتشرشده باشد؛ روایت پیش‌نویس یا زمان‌بندی‌شده از این مسیر باز نمی‌شود.
          </p>
          <div className="mt-3">
            <IdLookup
              id="narrative-id"
              label="شناسه روایت"
              placeholder="مثلاً 1234"
              searchLabel="جست‌وجو در روایت‌های عمومی"
              searchPlaceholder="بخشی از متن روایت"
              hint="جست‌وجو از ایندکس عمومی استفاده می‌کند و ممکن است نتایج تأخیر داشته باشد."
              onPick={(result: LookupResult) => void openNarrative(String(result.id))}
              onSearch={async (query) =>
                (await searchNarratives(query)).map((row) => ({
                  id: row.id,
                  title: row.title,
                  subtitle: row.authorName,
                }))
              }
            />
          </div>

          {loadingNarrative ? (
            <p role="status" className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              در حال دریافت روایت…
            </p>
          ) : null}
          {narrativeError ? (
            <p role="alert" className="mt-3 text-[11px] font-bold text-danger-foreground">
              {narrativeError}
            </p>
          ) : null}
        </section>

        {narrative ? (
          <section aria-label="روایت باز‌شده" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-xs font-black text-foreground-secondary">
                <BookOpen aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
                روایت #{narrative.id}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[10px] text-foreground-secondary">
                  {narrative.authorName || "نویسنده نامشخص"}
                </span>
                {narrative.editorial ? (
                  <span className="rounded-pill border border-brand-border bg-selected px-2 py-0.5 text-[10px] font-black text-selected-foreground">
                    در صف سردبیری
                  </span>
                ) : null}
                {narrative.contentId ? (
                  <Link
                    href={`/admin/content/${narrative.contentId}` as Route}
                    className="rounded-pill border border-info-border bg-info-surface px-2 py-0.5 text-[10px] font-black text-info-foreground"
                  >
                    محتوا #{narrative.contentId}
                  </Link>
                ) : null}
              </div>
            </div>

            <p className="whitespace-pre-wrap text-[11px] leading-6 text-foreground-secondary">
              {narrative.body || "متن روایت خالی است."}
            </p>

            {narrative.attachments.length ? (
              <p className="text-[10px] text-muted-foreground">
                {fa(narrative.attachments.length)} ضمیمه رسانه‌ای
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-divider pt-3">
              <button
                type="button"
                onClick={() => void toggleEditorial(narrative, !narrative.editorial)}
                className={narrative.editorial ? secondaryButtonClass : primaryButtonClass}
              >
                {narrative.editorial ? "حذف از صف سردبیری" : "افزودن به صف سردبیری"}
              </button>

              {narrative.contentId ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setRemoveOpen(true);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-control bg-danger px-4 text-xs font-black text-danger-solid-foreground transition-colors hover:opacity-90"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  حذف پیوند محتوا
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setPrimaryAttachmentId(null);
                    setConvertTitle((narrative.body || "").split("\n")[0].trim().slice(0, 120));
                    setConvertCategory("");
                    setConvertFeatured(false);
                    void getNoteCategories().then(setNoteCategories).catch(() => setNoteCategories([]));
                    setConvertOpen(true);
                  }}
                  className={primaryButtonClass}
                >
                  <FileText aria-hidden="true" className="h-4 w-4" />
                  تبدیل به محتوا
                </button>
              )}
            </div>
          </section>
        ) : null}

        {narrative ? (
          <section aria-label="بازتاب رسانه‌ای" className="space-y-3 rounded-card border border-border bg-surface p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-black text-foreground-secondary">بازتاب رسانه‌ای</h2>
              <button type="button" onClick={() => openReflection("new")} className={secondaryButtonClass}>
                افزودن بازتاب
              </button>
            </div>

            {reflections.length === 0 ? (
              <AdminEmptyState
                title="بازتابی ثبت نشده است."
                description="برای این روایت هنوز رسانه‌ای بازتاب ثبت نشده است."
              />
            ) : (
              <ul className="divide-y divide-divider">
                {reflections.map((reflection) => (
                  <li key={reflection.id} className="flex items-start gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-foreground">
                        {reflection.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {reflection.outletName || "رسانه نامشخص"}
                        {reflection.publishedAt ? ` · ${formatAdminDate(reflection.publishedAt)}` : ""}
                      </span>
                      {reflection.url ? (
                        <a
                          href={reflection.url}
                          target="_blank"
                          rel="noreferrer"
                          dir="ltr"
                          className="mt-0.5 block truncate text-left text-[10px] text-link"
                        >
                          {reflection.url}
                        </a>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openReflection(reflection)}
                        className="rounded-control border border-border px-2.5 py-1 text-[10px] font-black text-foreground-secondary transition-colors hover:bg-hover"
                      >
                        ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRefMessage(null);
                          setPendingDeleteReflection(reflection);
                        }}
                        className="rounded-control border border-danger-border px-2.5 py-1 text-[10px] font-black text-danger-foreground transition-colors hover:bg-danger-surface"
                      >
                        حذف
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section aria-label="صف سردبیری" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">
            صف سردبیری ({fa(editorial.total)})
          </h2>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            صفحه {fa(editorial.page)} از {fa(Math.max(1, editorial.totalPages))}
          </p>

          {queueError ? (
            <AdminErrorState message={queueError} onRetry={() => void loadQueue()} retrying={loadingQueue} />
          ) : editorial.items.length === 0 ? (
            <AdminEmptyState
              title="صف سردبیری خالی است."
              description="روایتی برای سردبیری نشان نشده است. از جست‌وجوی بالا یک روایت را باز کنید."
            />
          ) : (
            <ul className="mt-3 divide-y divide-divider">
              {editorial.items.map((row) => (
                <li key={row.id} className="flex items-start gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => void openNarrative(String(row.id))}
                      className="block max-w-full truncate text-right text-[11px] font-black text-foreground hover:text-brand"
                    >
                      {row.title}
                    </button>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      #{row.id}
                      {row.authorName ? ` · ${row.authorName}` : ""}
                      {row.contentId ? " · به محتوا تبدیل شده" : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void openNarrative(String(row.id))}
                      className="rounded-control border border-border px-2.5 py-1 text-[10px] font-black text-foreground-secondary transition-colors hover:bg-hover"
                    >
                      باز کردن
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleEditorial(row, false)}
                      className="rounded-control border border-danger-border px-2.5 py-1 text-[10px] font-black text-danger-foreground transition-colors hover:bg-danger-surface"
                    >
                      حذف
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {convertOpen ? (
        <AdminDialog
          title="تبدیل روایت به محتوا"
          description="قالب محتوای ساخته‌شده را انتخاب کنید. این عملیات تکرارپذیر است و محتوای تکراری نمی‌سازد."
          confirmLabel="تبدیل کن"
          busy={busy}
          error={actionError}
          onConfirm={() => void doConvert()}
          onClose={() => setConvertOpen(false)}
        >
          <AdminField label="عنوان" htmlFor="convert-title" required>
            <input id="convert-title" value={convertTitle} maxLength={190} onChange={(event) => setConvertTitle(event.target.value)} className={fieldClass} />
          </AdminField>
          <AdminField label="نوع محتوا" htmlFor="convert-content-type" required>
            <select id="convert-content-type" value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)} className={fieldClass}>
              {CONTENT_TYPES.map((item) => <option key={item} value={item}>{CONTENT_TYPE_LABELS[item]}</option>)}
            </select>
          </AdminField>
          <AdminField label="قالب محتوا" htmlFor="convert-format" required>
            <select
              id="convert-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as ContentFormat)}
              className={fieldClass}
            >
              {CONTENT_FORMATS.map((item) => (
                <option key={item} value={item}>
                  {CONTENT_FORMAT_LABELS[item]}
                </option>
              ))}
            </select>
          </AdminField>
          {contentType === "speech" ? <><AdminField label="دسته‌بندی" htmlFor="convert-category" hint="از دسته‌بندی سخنرانان یا دسته‌های اختصاصی یادداشت. اگر انتخاب نکنید و ناشر سخنران باشد، دستهٔ خودِ او؛ وگرنه بدون دسته.">
            <select id="convert-category" value={convertCategory} onChange={(event) => setConvertCategory(event.target.value)} className={fieldClass}>
              <option value="">خودکار (دستهٔ سخنران یا بدون دسته)</option>
              <optgroup label="دسته‌بندی‌های یادداشت">
                {noteCategories.filter((item) => item.source === "note").map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </optgroup>
              <optgroup label="دسته‌بندی‌های سخنرانان">
                {noteCategories.filter((item) => item.source === "speaker").map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
              </optgroup>
            </select>
          </AdminField>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={convertFeatured} onChange={(event) => setConvertFeatured(event.target.checked)} className="mt-1" />
            <span><b>برگزیده</b><span className="block text-muted-foreground">در بخش «برگزیده‌ها» بالای صفحهٔ یادداشت‌ها نمایش داده می‌شود.</span></span>
          </label></> : null}
          {narrative?.attachments.length ? (
            <AdminField label="فایل اصلی" htmlFor="convert-primary-attachment" required hint="نمای بالای صفحه محتوا با این فایل ساخته می‌شود.">
              <select id="convert-primary-attachment" value={primaryAttachmentId ?? ""} onChange={(event) => setPrimaryAttachmentId(event.target.value ? Number(event.target.value) : null)} className={fieldClass}>
                <option value="">انتخاب فایل اصلی</option>
                {narrative.attachments.map((attachment) => <option key={attachment.mediaId} value={attachment.mediaId}>{attachment.type === "video" ? "ویدیو" : attachment.type === "audio" ? "صوت" : attachment.type === "image" ? "تصویر" : "فایل"} · #{attachment.mediaId}</option>)}
              </select>
            </AdminField>
          ) : null}
        </AdminDialog>
      ) : null}

      {removeOpen ? (
        <AdminDialog
          title="حذف پیوند محتوا"
          description="پیوند روایت به محتوا پاک و خود محتوا به زباله‌دان منتقل می‌شود."
          confirmLabel="حذف کن"
          tone="danger"
          busy={busy}
          error={actionError}
          onConfirm={() => void doRemoveContent()}
          onClose={() => setRemoveOpen(false)}
        />
      ) : null}

      {reflectionOpen ? (
        <AdminDialog
          title={reflectionOpen === "new" ? "بازتاب تازه" : "ویرایش بازتاب"}
          description="اگر رسانه را از فهرست انتخاب کنید، نام آن از خود رسانه خوانده می‌شود."
          confirmLabel="ذخیره"
          busy={refBusy}
          error={refMessage}
          onConfirm={() => void submitReflection()}
          onClose={() => setReflectionOpen(null)}
        >
          <div className="space-y-4">
            <AdminFieldMessage message={refMessage} />
            <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="رسانه" htmlFor="reflection-outlet">
              <select
                id="reflection-outlet"
                value={refOutletId ?? ""}
                onFocus={ensureOutlets}
                onChange={(event) => {
                  const next = event.target.value ? Number(event.target.value) : null;
                  setRefOutletId(next);
                  const picked = outlets.find((outlet) => outlet.id === next);
                  if (picked) setRefOutlet(picked.name);
                }}
                className={fieldClass}
              >
                <option value="">بدون اتصال به رسانه ثبت‌شده</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label="نام رسانه (متن آزاد)"
              htmlFor="reflection-outlet-text"
              hint="اگر رسانه‌ای انتخاب نکنید، همین نام ذخیره می‌شود."
            >
              <input
                id="reflection-outlet-text"
                value={refOutlet}
                onFocus={ensureOutlets}
                onChange={(event) => setRefOutlet(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="عنوان بازتاب" htmlFor="reflection-title" required>
              <input
                id="reflection-title"
                value={refTitle}
                onChange={(event) => setRefTitle(event.target.value)}
                className={fieldClass}
              />
            </AdminField>
            <AdminField label="نشانی" htmlFor="reflection-url" required>
              <input
                id="reflection-url"
                value={refUrl}
                dir="ltr"
                placeholder="https://"
                onChange={(event) => setRefUrl(event.target.value)}
                className={`${fieldClass} text-left`}
              />
            </AdminField>
            </div>
            <AdminDisclosureSection title="جزئیات انتشار" defaultOpen={Boolean(refSummary || refPublishedAt)}>
            <AdminField label="خلاصه" htmlFor="reflection-summary">
              <textarea
                id="reflection-summary"
                value={refSummary}
                rows={3}
                onChange={(event) => setRefSummary(event.target.value)}
                className={`${fieldClass} resize-none`}
              />
            </AdminField>
            <div>
              <span className="mb-1.5 block text-xs font-bold text-foreground-secondary">تاریخ انتشار</span>
              <PersianDatePicker value={refPublishedAt} onChange={setRefPublishedAt} allow="any" ariaLabel="تاریخ انتشار بازتاب" />
            </div>
            </AdminDisclosureSection>
            <AdminDisclosureSection title="تصویر رسانه" defaultOpen={Boolean(refLogoMediaId || (reflectionOpen !== "new" && reflectionOpen.logoUrl))}>
            <MediaPickerField
              id="reflection-logo"
              label="نشان رسانه در این بازتاب"
              mediaId={refLogoMediaId}
              currentUrl={reflectionOpen === "new" ? null : reflectionOpen.logoUrl}
              onChange={setRefLogoMediaId}
            />
            </AdminDisclosureSection>
          </div>
        </AdminDialog>
      ) : null}

      {pendingDeleteReflection ? (
        <AdminDialog
          title="حذف بازتاب رسانه‌ای"
          description={`«${pendingDeleteReflection.title}» برای همیشه حذف می‌شود؛ این حذف نرم نیست.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={refBusy}
          error={refMessage}
          onConfirm={() => void confirmDeleteReflection()}
          onClose={() => setPendingDeleteReflection(null)}
        />
      ) : null}
    </div>
  );
}
