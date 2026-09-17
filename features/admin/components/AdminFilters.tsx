"use client";

import type { ReactNode } from "react";
import { RotateCcw, Search } from "lucide-react";
import {
  chipActiveClass,
  chipClass,
  chipIdleClass,
  inlineFieldClass,
} from "./styles";

export type AdminFilterOption = { value: string; label: string };

export type AdminFilter =
  | {
      kind: "search";
      key: string;
      label: string;
      placeholder?: string;
      value: string;
      onChange: (value: string) => void;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      value: string;
      options: AdminFilterOption[];
      onChange: (value: string) => void;
      disabled?: boolean;
      /** Small explanatory line under the control, e.g. "applies to this page only". */
      hint?: string;
    }
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
      value: string;
      onChange: (value: string) => void;
      inputMode?: "text" | "numeric";
    }
  | {
      /** A toggle row, e.g. the verified filter that is on/off/absent. */
      kind: "toggle";
      key: string;
      label: string;
      options: AdminFilterOption[];
      value: string;
      onChange: (value: string) => void;
    }
  | { kind: "custom"; key: string; label: string; render: ReactNode };

/**
 * The filter row shared by every list. It is deliberately declarative: each
 * list passes its own descriptors, so a new filter never means a new layout.
 */
export function AdminFilters({
  filters,
  onSubmit,
  onReset,
  busy = false,
  resetLabel = "حذف فیلترها",
}: {
  filters: AdminFilter[];
  /** Filters apply on submit so a typed query does not refetch per keystroke. */
  onSubmit: () => void;
  onReset?: () => void;
  busy?: boolean;
  resetLabel?: string;
}) {
  if (filters.length === 0) return null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="admin-filters border-b border-divider bg-surface px-4 py-4 sm:px-6 lg:px-10"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) => {
          if (filter.kind === "search") {
            return (
              <label
                key={filter.key}
                className="block sm:col-span-2 xl:col-span-4"
              >
                <span className="mb-1 block truncate text-[10px] font-black text-foreground-secondary">
                  {filter.label}
                </span>
                <span className="flex min-h-11 items-center gap-2 rounded-xl border border-input-border bg-input px-3.5 focus-within:border-ring">
                  <Search
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-icon-muted"
                  />
                  <input
                    value={filter.value}
                    onChange={(event) => filter.onChange(event.target.value)}
                    placeholder={filter.placeholder}
                    aria-label={filter.label}
                    className="h-10 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder"
                  />
                </span>
              </label>
            );
          }

          if (filter.kind === "select") {
            return (
              <label key={filter.key} className="block min-w-0">
                <span className="mb-1 block truncate text-[10px] font-black text-foreground-secondary">
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  disabled={filter.disabled}
                  onChange={(event) => filter.onChange(event.target.value)}
                  aria-label={filter.label}
                  aria-describedby={
                    filter.hint ? `${filter.key}-hint` : undefined
                  }
                  className={inlineFieldClass}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {filter.hint ? (
                  <span
                    id={`${filter.key}-hint`}
                    className="mt-1 block text-[10px] leading-5 text-muted-foreground"
                  >
                    {filter.hint}
                  </span>
                ) : null}
              </label>
            );
          }

          if (filter.kind === "text") {
            return (
              <label key={filter.key} className="block">
                <span className="mb-1 block truncate text-[10px] font-black text-foreground-secondary">
                  {filter.label}
                </span>
                <input
                  value={filter.value}
                  inputMode={filter.inputMode}
                  onChange={(event) => filter.onChange(event.target.value)}
                  placeholder={filter.placeholder}
                  aria-label={filter.label}
                  className={inlineFieldClass}
                />
              </label>
            );
          }

          if (filter.kind === "toggle") {
            return (
              <fieldset key={filter.key} className="min-w-0">
                <legend className="mb-1 block text-[10px] font-black text-foreground-secondary">
                  {filter.label}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {filter.options.map((option) => {
                    const active = filter.value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => filter.onChange(option.value)}
                        className={`${chipClass} ${active ? chipActiveClass : chipIdleClass}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          }

          return (
            <div key={filter.key} className="min-w-0">
              <span className="mb-1 block truncate text-[10px] font-black text-foreground-secondary">
                {filter.label}
              </span>
              {filter.render}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-divider pt-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control bg-brand px-4 text-xs font-black text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60 sm:flex-none"
        >
          اعمال فیلترها
        </button>
        {onReset ? (
          <button
            type="button"
            disabled={busy}
            onClick={onReset}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-black text-foreground-secondary transition-colors hover:bg-hover disabled:opacity-60 sm:flex-none"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            {resetLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
