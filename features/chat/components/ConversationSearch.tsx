"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function ConversationSearch({ query, resultCount, isLoading, onChange, onClose }: { query: string; resultCount: number; isLoading: boolean; onChange: (value: string) => void; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-glass px-3 py-2 backdrop-blur-md">
      <Search className="h-4.5 w-4.5 shrink-0 text-icon-muted" />
      <input ref={inputRef} value={query} onChange={(event) => onChange(event.target.value)} type="search" placeholder="جستجو در گفتگو…" className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
      {query ? <span className="whitespace-nowrap text-[10px] text-muted-foreground">{isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : `${resultCount.toLocaleString("fa-IR")} نتیجه`}</span> : null}
      <button type="button" onClick={onClose} aria-label="بستن جستجو" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-icon-muted hover:bg-hover"><X className="h-4.5 w-4.5" /></button>
    </div>
  );
}
