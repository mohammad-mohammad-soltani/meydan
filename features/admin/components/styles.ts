/**
 * Class strings shared by every admin screen.
 *
 * The project has no component library — each feature copies the same utility
 * strings — so the admin panel keeps its own copy here instead of inventing a
 * new styling contract. Nothing here uses palette colors: only the semantic
 * tokens declared in `app/globals.css`.
 */

/** A text input / select / textarea. */
export const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-input-border bg-input px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-subtle";

/** The same field without the label gap, for inline filter rows. */
export const inlineFieldClass =
  "min-h-11 w-full rounded-xl border border-input-border bg-input px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring";

export const labelClass =
  "block text-xs font-bold text-foreground-secondary";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2 text-sm font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground-secondary transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 py-2 text-sm font-black text-danger-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const chipClass =
  "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-pill border px-2.5 text-[10px] font-black transition-colors";

export const chipIdleClass =
  "border-border bg-surface text-muted-foreground hover:bg-hover hover:text-foreground";

export const chipActiveClass =
  "border-brand-border bg-selected text-selected-foreground";

export const sectionCardClass =
  "rounded-2xl border border-border bg-surface-elevated shadow-card";

export const tableHeadClass =
  "bg-surface-muted/60 text-[10px] font-black uppercase tracking-wide text-muted-foreground";

export const tableCellClass = "px-4 py-3 text-sm text-foreground";

export const tableWrapClass = "overflow-x-auto no-scrollbar";

/** A monospace-ish numeric cell, for ids and coordinates. */
export const numericCellClass =
  "font-sans text-xs tabular-nums text-foreground-secondary";

/** The Persian digits helper used across the panel. */
export function fa(value: number | string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("fa-IR");
}
