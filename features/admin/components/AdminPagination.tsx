"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { fa } from "./styles";

/**
 * Page/per_page pagination driven by the backend's `meta` (`page`, `per_page`,
 * `total`, `pages`). It renders nothing when the result set fits on one page,
 * so a short list never grows a pointless control.
 */
export function AdminPagination({
  page,
  pages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [20, 50, 100],
  busy = false,
}: {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  /** The backend caps `per_page` at 100 (squares) or 50 (programs). */
  perPageOptions?: number[];
  busy?: boolean;
}) {
  if (pages <= 1 && !onPerPageChange) return null;

  return (
    <nav
      aria-label="صفحه‌بندی"
      className="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface-muted/40 px-3 py-2.5"
    >
      <p className="text-[11px] text-muted-foreground">
        {fa(total)} مورد · صفحه {fa(page)} از {fa(Math.max(1, pages))}
      </p>

      <div className="flex items-center gap-2">
        {onPerPageChange ? (
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-foreground-secondary">
            در هر صفحه
            <select
              value={perPage}
              disabled={busy}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              className="rounded-control border border-input-border bg-input px-2 py-1 text-[11px] text-foreground outline-none focus:border-ring"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {fa(option)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={busy || page <= 1}
          aria-label="صفحه قبل"
          className="grid h-8 w-8 place-items-center rounded-control border border-border bg-surface text-icon-muted transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={busy || page >= pages}
          aria-label="صفحه بعد"
          className="grid h-8 w-8 place-items-center rounded-control border border-border bg-surface text-icon-muted transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/**
 * The capped lists (speakers 50, requests 100, participants 100) have no
 * pagination at all. This states the ceiling instead of faking pages.
 */
export function AdminListCapNotice({ shown, cap }: { shown: number; cap: number }) {
  if (shown < cap) return null;

  return (
    <p className="border-t border-divider bg-surface-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
      {`حداکثر ${fa(cap)} ردیف نمایش داده می‌شود؛ برای دیدن بقیه از فیلترها استفاده کنید.`}
    </p>
  );
}
