"use client";

import type { ReactNode } from "react";
import { Inbox, AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { primaryButtonClass, secondaryButtonClass } from "./styles";

/** The one empty state every list renders, with an optional primary action. */
export function AdminEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="admin-empty-state mx-4 my-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated px-4 py-16 text-center shadow-card lg:mx-10">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-muted text-icon-muted">
        {icon ?? <Inbox size={25} strokeWidth={1.5} aria-hidden="true" />}
      </span>
      <p className="mt-3 text-xs font-black text-foreground-secondary">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[11px] leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={`${primaryButtonClass} mt-4`}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * A retryable failure. The message is the Persian sentence from the API (see
 * `adminErrorMessage`), never a raw status code.
 */
export function AdminErrorState({
  message,
  onRetry,
  retrying = false,
  retryLabel = "تلاش دوباره",
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="mx-4 my-6 flex flex-col items-center justify-center rounded-2xl border border-danger-border bg-danger-surface/40 px-4 py-16 text-center lg:mx-10"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-danger-surface text-danger">
        <AlertTriangle aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-3 max-w-sm text-xs font-bold leading-6 text-danger-foreground">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={`${secondaryButtonClass} mt-4`}
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
          />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/** A page-level loading block; the route `loading.tsx` uses the shell skeleton. */
export function AdminLoadingState({
  label = "در حال دریافت اطلاعات…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-16 text-xs font-bold text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-4 w-4 animate-spin text-brand"
      />
      {label}
    </div>
  );
}

/** Rows-in-a-table skeleton, so a refresh does not collapse the layout. */
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری فهرست"
      className="divide-y divide-divider"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3.5">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-skeleton" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-1/3 animate-pulse rounded bg-skeleton" />
            <span className="block h-2.5 w-2/3 animate-pulse rounded bg-skeleton" />
          </span>
        </div>
      ))}
    </div>
  );
}
