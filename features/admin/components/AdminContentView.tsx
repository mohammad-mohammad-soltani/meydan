"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { FolderKanban, Plus, RefreshCw } from "lucide-react";
import { AdminErrorState, AdminTableSkeleton } from "./AdminStateViews";
import { AdminFilters, type AdminFilter } from "./AdminFilters";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminTable, type AdminColumn } from "./AdminTable";
import { PostStatusBadge } from "./AdminStatusBadge";
import { fa, secondaryButtonClass } from "./styles";
import { formatAdminDate } from "../lib/datetime";
import {
  CONTENT_LIST_LIMITATION,
  adminErrorMessage,
  getContentList,
} from "../services/content.service";
import {
  CONTENT_FORMATS,
  CONTENT_FORMAT_LABELS,
  type ContentFormat,
  type ContentItem,
} from "../types";

/**
 * The content list.
 *
 * There is no `GET /admin/content` on the backend, so this is the *public*
 * cursor-paged list: it can only ever show published rows, and the header says
 * so. Drafts are only visible in wp-admin.
 */
export function AdminContentView({ initial }: { initial: { items: ContentItem[]; nextCursor: string | null } }) {
  const [filters, setFilters] = useState({ format: "", featured: false });
  const [applied, setApplied] = useState({ format: "", featured: false });
  const [items, setItems] = useState(initial.items);
  const [nextCursor, setNextCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (next: { format: string; featured: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const page = await getContentList(
        { format: next.format, featured: next.featured, category: "", tag: "" },
        null,
      );
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت فهرست محتوا ممکن نشد."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await getContentList(
        { format: applied.format, featured: applied.featured, category: "", tag: "" },
        nextCursor,
      );
      // Cursor pages can overlap when items are published mid-scroll; dedupe by id.
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (reason) {
      setError(adminErrorMessage(reason, "دریافت صفحه بعد ممکن نشد."));
    } finally {
      setLoadingMore(false);
    }
  };

  const descriptors: AdminFilter[] = [
    {
      kind: "select",
      key: "format",
      label: "قالب",
      value: filters.format,
      options: [
        { value: "", label: "همه قالب‌ها" },
        ...CONTENT_FORMATS.map((format) => ({
          value: format,
          label: CONTENT_FORMAT_LABELS[format],
        })),
      ],
      onChange: (value) => setFilters((current) => ({ ...current, format: value })),
    },
    {
      kind: "toggle",
      key: "featured",
      label: "ویژه",
      value: filters.featured ? "true" : "",
      options: [
        { value: "", label: "همه" },
        { value: "true", label: "فقط ویژه" },
      ],
      onChange: (value) => setFilters((current) => ({ ...current, featured: value === "true" })),
    },
  ];

  const columns: Array<AdminColumn<ContentItem>> = [
    {
      key: "title",
      header: "محتوا",
      // The card layout on narrow screens uses this as the row heading.
      primary: true,
      render: (item) => (
        <div className="min-w-0">
          <Link
            href={`/admin/content/${item.id}` as Route}
            className="block truncate text-xs font-black text-foreground hover:text-brand"
          >
            {item.title || `محتوا #${item.id}`}
          </Link>
          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
            {item.excerpt || item.subtitle || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "format",
      header: "قالب",
      render: (item) => (
        <span className="rounded-pill border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-black text-foreground-secondary">
          {CONTENT_FORMAT_LABELS[item.format as ContentFormat] ?? item.format}
        </span>
      ),
    },
    {
      key: "state",
      header: "وضعیت",
      render: (item) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <PostStatusBadge status="publish" />
          {item.featured ? (
            <span className="rounded-pill border border-accent-border bg-accent-surface px-2 py-0.5 text-[10px] font-black text-accent-foreground">
              ویژه
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "media",
      header: "رسانه",
      render: (item) => (
        <span className="text-[11px] text-foreground-secondary">
          {fa(item.attachments.length)} ضمیمه
        </span>
      ),
    },
    {
      key: "date",
      header: "انتشار",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatAdminDate(item.publishedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <AdminPageHeader
        title="بسته محتوا"
        description="ساخت، ویرایش و حذف محتوای منتشرشده."
        crumbs={[{ label: "بسته محتوا" }]}
        limitation={CONTENT_LIST_LIMITATION}
        actions={
          <>
            <button type="button" onClick={() => void load(applied)} className={secondaryButtonClass}>
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بازخوانی
            </button>
            <Link
              href={"/admin/content/new" as Route}
              className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              محتوای تازه
            </Link>
          </>
        }
      />

      <AdminFilters
        filters={descriptors}
        onSubmit={() => {
          setApplied(filters);
          void load(filters);
        }}
        onReset={() => {
          const empty = { format: "", featured: false };
          setFilters(empty);
          setApplied(empty);
          void load(empty);
        }}
        busy={loading}
      />

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load(applied)} retrying={loading} />
      ) : loading ? (
        <AdminTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={items}
            rowKey={(item) => item.id}
            caption="فهرست محتوا"
            emptyTitle="محتوایی با این فیلترها پیدا نشد."
            emptyDescription="فیلترها را تغییر دهید یا محتوای تازه بسازید."
            emptyIcon={<FolderKanban aria-hidden="true" className="h-5 w-5" />}
          />

          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <p className="text-[10px] text-muted-foreground">{fa(items.length)} مورد نمایش داده شد</p>
            {nextCursor ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className={secondaryButtonClass}
              >
                {loadingMore ? "در حال دریافت…" : "موارد بیشتر"}
              </button>
            ) : (
              <p className="text-[10px] text-muted-foreground">پایان فهرست</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
