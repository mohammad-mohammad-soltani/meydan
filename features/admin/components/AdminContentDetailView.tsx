"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { AdminNotice } from "./AdminNotice";
import { AdminPageHeader } from "./AdminPageHeader";
import { PostStatusBadge } from "./AdminStatusBadge";
import { dangerButtonClass, fa, secondaryButtonClass } from "./styles";
import { adminErrorMessage, deleteContent } from "../services/content.service";
import type { ContentItem } from "../types";
import { CONTENT_FORMAT_LABELS, CONTENT_TYPE_LABELS, type ContentFormat } from "../types";
import { formatAdminDate, formatAdminDateTime } from "../lib/datetime";

/** One labelled data row in the read-only summary. */
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
 * Read-only content detail with the destructive action.
 *
 * Editing happens on `/admin/content/[id]/edit`; keeping the two apart means the
 * delete confirmation never sits inside a form the admin is mid-way through.
 */
export function AdminContentDetailView({ content }: { content: ContentItem }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteContent(String(content.id));
      router.push("/admin/content" as Route);
      router.refresh();
    } catch (reason) {
      setError(adminErrorMessage(reason, "حذف محتوا ممکن نشد."));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title={content.title || `محتوا #${content.id}`}
        description={content.excerpt || content.subtitle || "بدون خلاصه"}
        crumbs={[{ label: "بسته محتوا", href: "/admin/content" }, { label: `#${content.id}` }]}
        actions={
          <>
            <Link href={"/admin/content" as Route} className={secondaryButtonClass}>
              بازگشت
            </Link>
            <Link
              href={`/admin/content/${content.id}/edit` as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              ویرایش
            </Link>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setDeleteOpen(true);
              }}
              className={dangerButtonClass}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              حذف
            </button>
          </>
        }
      />

      <div className="space-y-4 px-3 py-4 pb-24 sm:px-4">
        <section aria-label="مشخصات" className="rounded-card border border-border bg-surface px-3.5 py-2">
          <Row label="شناسه" value={`#${content.id}`} />
          <Row label="نوع محتوا" value={content.contentType ? CONTENT_TYPE_LABELS[content.contentType] : ""} />
          <Row label="مالک" value={content.isUser ? `کاربر #${content.userId ?? ""}` : `تولیدکننده #${content.creatorId ?? ""}`} />
          <Row label="زمان محتوا" value={formatAdminDateTime(content.time)} />
          <Row label="زمان ثبت" value={formatAdminDateTime(content.createdAt)} />
          <Row label="بازدید" value={fa(content.viewCounts)} />
          <Row label="شناسه کاور" value={content.mediaCover ? `#${content.mediaCover}` : ""} />
          <Row
            label="قالب"
            value={CONTENT_FORMAT_LABELS[content.format as ContentFormat] ?? content.format}
          />
          <Row label="نشانی یکتا" value={content.slug} />
          <Row label="دسته‌بندی" value={content.category?.name ?? ""} />
          <Row label="تاریخ انتشار" value={formatAdminDate(content.publishedAt)} />
          <Row label="برچسب‌ها" value={content.tags.join("، ")} />
          <Row label="تعداد ضمیمه" value={fa(content.attachments.length)} />
          <Row label="تولیدکننده اصلی" value={content.producer?.name ?? ""} />
        </section>

        <section aria-label="وضعیت" className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface px-3.5 py-3">
          <PostStatusBadge status="publish" />
          {content.featured ? (
            <span className="rounded-pill border border-accent-border bg-accent-surface px-2 py-0.5 text-[10px] font-black text-accent-foreground">
              ویژه
            </span>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            این صفحه فقط محتوای منتشرشده را نشان می‌دهد؛ برای انتشار یا پیش‌نویس، از ویرایش استفاده
            کنید.
          </p>
        </section>

        <section aria-label="متن" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">متن</h2>
          <p className="mt-2 whitespace-pre-wrap text-[11px] leading-6 text-foreground-secondary">
            {content.body || "متنی ثبت نشده است."}
          </p>
        </section>

        <section aria-label="ضمیمه‌ها" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">ضمیمه‌ها</h2>
          {content.attachments.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">ضمیمه‌ای ثبت نشده است.</p>
          ) : (
            <ul className="mt-2 divide-y divide-divider">
              {content.attachments.map((attachment) => (
                <li key={attachment.mediaId} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{attachment.mediaId}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-foreground-secondary">
                    {attachment.mediaTitle || "بدون عنوان"} — {attachment.mediaSubtitle || "بدون زیرعنوان"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{attachment.mimeType} · {fa(attachment.size)} بایت</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    ترتیب {fa(attachment.order)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="تولیدکنندگان" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">تولیدکنندگان</h2>
          {content.creators.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">تولیدکننده‌ای ثبت نشده است.</p>
          ) : (
            <ul className="mt-2 divide-y divide-divider">
              {content.creators.map((creator) => (
                <li key={creator.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/creators/${creator.id}` as Route}
                    className="text-[11px] font-bold text-foreground hover:text-brand"
                  >
                    تولیدکننده #{creator.id}
                  </Link>
                  <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                    {creator.roleLabel || "بدون نقش"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="یادداشت استفاده" className="rounded-card border border-border bg-surface p-3.5">
          <h2 className="text-xs font-black text-foreground-secondary">یادداشت استفاده</h2>
          <p className="mt-2 whitespace-pre-wrap text-[11px] leading-6 text-foreground-secondary">
            {content.usageNote || "یادداشتی ثبت نشده است."}
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground">
          تاریخ‌ها در پنل به تقویم شمسی نمایش داده می‌شوند.
        </p>
      </div>

      {deleteOpen ? (
        <AdminDialog
          title="حذف محتوا"
          description={`«${content.title}» به زباله‌دان منتقل می‌شود. این عملیات نرم است و رکورد در وردپرس باقی می‌ماند.`}
          confirmLabel="حذف کن"
          tone="danger"
          busy={busy}
          error={error}
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}

      {error && !deleteOpen ? (
        <AdminNotice tone="error" message={error} className="m-3" />
      ) : null}
    </div>
  );
}
