import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Clock } from "lucide-react";
import type { ReactNode } from "react";

/** A small «به‌زودی» pill used wherever a button leads to a page that is not open yet. */
export function SoonBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground ${className}`}>
      <Clock aria-hidden="true" className="h-3 w-3" />
      به‌زودی
    </span>
  );
}

/** Header (back, title, subtitle) shared by the pages that are designed ahead of their backend. */
export function PageShell({ title, subtitle, back, soon = false, children }: { title: string; subtitle?: string; back: string; soon?: boolean; children: ReactNode }) {
  return (
    <section className="min-h-full pb-24 text-foreground" dir="rtl">
      <header className="flex items-center sticky top-0 z-20 gap-2.5 bg-background px-3.5 py-3">
        <Link href={back as Route} aria-label="بازگشت" className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-border bg-surface-muted text-icon transition-colors hover:bg-hover">
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-extrabold">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {soon ? <SoonBadge /> : null}
      </header>
      {children}
    </section>
  );
}

export const fieldClass = "min-h-[46px] w-full rounded-2xl border border-input-border bg-input px-4 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder focus:border-ring disabled:opacity-60";
