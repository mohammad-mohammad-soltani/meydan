"use client";

import { useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { AdminEmptyState } from "./AdminStateViews";
import { fieldClass, secondaryButtonClass } from "./styles";

export type LookupResult = {
  id: number;
  title: string;
  subtitle?: string;
};

/**
 * "Find a record by its id, or by searching."
 *
 * The admin API has no narrative list (`/editorial/narratives` only returns
 * flagged ones and `/explore/search` is the public index), so the workshop
 * needs both entry points: paste a numeric id directly, or search and pick from
 * the results. The component owns only the query and the result list; the
 * caller supplies the lookup function and decides what to do with a hit.
 */
export function IdLookup({
  id,
  label,
  placeholder = "شناسه عددی",
  searchLabel = "جست‌وجو",
  searchPlaceholder = "بخشی از متن یا عنوان",
  onPick,
  onSearch,
  disabled = false,
  /** Shown under the id input, e.g. "روایت باید منتشرشده باشد". */
  hint,
}: {
  id: string;
  label: string;
  placeholder?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  onPick: (result: LookupResult) => void;
  onSearch: (query: string) => Promise<LookupResult[]>;
  disabled?: boolean;
  hint?: string;
}) {
  const [rawId, setRawId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const submitId = () => {
    const value = Number(rawId.trim());
    if (!Number.isFinite(value) || value <= 0) {
      setError("شناسه باید یک عدد مثبت باشد.");
      return;
    }
    setError(null);
    onPick({ id: value, title: `#${value}` });
  };

  const submitSearch = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const found = await onSearch(query);
      setResults(found);
      setSearched(true);
    } catch {
      setError("جست‌وجو ممکن نشد؛ دوباره تلاش کنید.");
      setResults([]);
      setSearched(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={id} className="block text-[11px] font-black text-foreground-secondary">
          {label}
        </label>
        {hint ? <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{hint}</p> : null}
        <div className="mt-1.5 flex items-center gap-2">
          <input
            id={id}
            value={rawId}
            inputMode="numeric"
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => setRawId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitId();
              }
            }}
            className={`${fieldClass} mt-0 w-32 text-center`}
          />
          <button type="button" disabled={disabled} onClick={submitId} className={secondaryButtonClass}>
            باز کردن
          </button>
        </div>
      </div>

      <div className="border-t border-divider pt-3">
        <label htmlFor={`${id}-query`} className="block text-[11px] font-black text-foreground-secondary">
          {searchLabel}
        </label>
        <form
          className="mt-1.5 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSearch();
          }}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 rounded-control border border-input-border bg-input px-3 focus-within:border-ring">
            <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-icon-muted" />
            <input
              id={`${id}-query`}
              value={query}
              disabled={disabled}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder"
            />
          </span>
          <button type="submit" disabled={disabled || busy} className={secondaryButtonClass}>
            {busy ? <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
            جست‌وجو
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-2 text-[10px] font-bold text-danger-foreground">
            {error}
          </p>
        ) : null}

        {results === null ? null : results.length === 0 && searched ? (
          <AdminEmptyState title="نتیجه‌ای پیدا نشد." description="عبارت دیگری را امتحان کنید یا شناسه را مستقیم وارد کنید." />
        ) : (
          <ul className="mt-2 divide-y divide-divider rounded-control border border-border">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => onPick(result)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-hover"
                >
                  <span className="shrink-0 rounded-pill bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-foreground-secondary">
                    #{result.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-foreground">
                      {result.title}
                    </span>
                    {result.subtitle ? (
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
