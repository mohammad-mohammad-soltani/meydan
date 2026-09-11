"use client";

import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  id: number;
  name: string;
};

export function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: Option[];
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value) ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase("fa-IR");
  const filtered = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) => option.name.toLocaleLowerCase("fa-IR").includes(normalizedQuery))
        : options,
    [normalizedQuery, options],
  );

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div ref={root} className="relative">
      <span className="mb-2 block text-xs font-black text-foreground-secondary">{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control border border-input-border bg-input px-3.5 text-right text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "font-bold" : "text-foreground-subtle"}>
          {loading ? "در حال دریافت…" : selected?.name ?? placeholder}
        </span>
        {loading ? (
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-icon-muted" />
        ) : (
          <ChevronDown className={`h-4 w-4 shrink-0 text-icon-muted transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && !disabled ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[700] overflow-hidden rounded-card border border-border bg-popover shadow-popover">
          <div className="flex items-center gap-2 border-b border-divider px-3">
            <Search className="h-4 w-4 shrink-0 text-icon-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-subtle"
            />
          </div>
          <div role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            {filtered.length ? (
              filtered.map((option) => {
                const active = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-control px-3 text-right text-xs transition-colors ${
                      active ? "bg-brand-muted font-black text-brand" : "text-foreground hover:bg-hover"
                    }`}
                  >
                    <span>{option.name}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-5 text-center text-xs text-muted-foreground">موردی پیدا نشد.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
