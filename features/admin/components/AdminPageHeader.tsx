import { LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

/** Breadcrumb entry attached to a page header. */
export type AdminCrumb = { label: string; href?: string };

/**
 * The header every admin screen renders. The breadcrumb is a real list so the
 * nesting is announced ("مسیر صفحه") instead of reading as loose text.
 */
export function AdminPageHeader({
  title,
  description,
  crumbs = [],
  actions,
  limitation,
}: {
  title: string;
  description?: string;
  crumbs?: AdminCrumb[];
  actions?: ReactNode;
  /** A data-availability caveat that must stay visible, e.g. "only published". */
  limitation?: string;
}) {
  return (
    <header className="admin-page-header border-b border-divider bg-surface px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      {crumbs.length ? (
        <nav aria-label="مسیر صفحه">
          <ol className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <li>
              <Link
                href={"/admin" as Route}
                className="transition-colors hover:text-brand"
              >
                پنل مدیریت
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
                {crumb.href ? (
                  <Link
                    href={crumb.href as Route}
                    className="transition-colors hover:text-brand"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-bold text-foreground-secondary">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <span className="admin-header-label">
          <LayoutDashboard size={14} aria-hidden="true" /> فضای مدیریت میدان
        </span>
      )}

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-black leading-8 text-foreground lg:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-xs leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {limitation ? (
        <p className="mt-3 rounded-control border border-warning-border bg-warning-surface px-3 py-2 text-[11px] leading-6 text-warning-foreground">
          {limitation}
        </p>
      ) : null}
    </header>
  );
}
