"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchModal } from "@/components/providers/SearchProvider";

const legacySearchCatalog = ["پایگاه میدان انقلاب تهران", "میدان امیرچخماق یزد", "حاج میثم مطیعی", "حجت‌الاسلام مهدی ماندگاری", "روایت میدان انقلاب", "پژواک کار خوب"];

/** Temporary React replacement for the selector-based legacy search modal. */
export function LegacySearchModal() {
  const { isSearchOpen, closeSearch } = useSearchModal();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa-IR");
    return normalized ? legacySearchCatalog.filter((item) => item.toLocaleLowerCase("fa-IR").includes(normalized)) : [];
  }, [query]);
  if (!isSearchOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="جستجو در میادین" className="search-backdrop fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 backdrop-blur-sm">
      <div className="search-panel w-full max-w-sm space-y-3 border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0b0f17]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white"><Search className="h-4 w-4 text-brand-red" />جستجو در میادین و روایت‌ها</span><button type="button" onClick={closeSearch} aria-label="بستن جستجو" className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="h-5 w-5" /></button></div>
        <label className="search-input-shell"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام میدان، شهر، هشتگ یا سخنران..." className="flex-1 border-0 bg-transparent px-1 py-2 text-xs text-slate-800 outline-none dark:text-slate-100" /></label>
        <div className="max-h-60 space-y-2 overflow-y-auto text-xs">{query.trim() ? <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">{results.length ? results.length + " نتیجه یافت شد" : "نتیجه‌ای پیدا نشد"}</p> : <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">نام میدان، شهر، هشتگ یا سخنران را جستجو کنید</p>}{results.map((result) => <div key={result} className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-200">{result}</div>)}</div>
      </div>
    </div>
  );
}
