import { CheckCircle2, Filter, TriangleAlert } from "lucide-react";
import type { ContentFilter } from "../types";

type ContentFiltersProps = { activeFilter: ContentFilter; onChange: (filter: ContentFilter) => void; };

const filters: Array<{ id: ContentFilter; label: string; icon?: "ready" | "urgent" }> = [
  { id: "all", label: "همه" },
  { id: "ready", label: "آماده استفاده", icon: "ready" },
  { id: "urgent", label: "ضروری", icon: "urgent" }
];

export function ContentFilters({ activeFilter, onChange }: ContentFiltersProps) {
  return <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar"><Filter className="h-4 w-4 shrink-0 text-slate-400" />{filters.map((filter) => <button key={filter.id} type="button" onClick={() => onChange(filter.id)} className={"inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-black transition " + (activeFilter === filter.id ? "border-brand-red/30 bg-brand-red/10 text-brand-red" : "border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400")}>{filter.icon === "ready" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}{filter.icon === "urgent" ? <TriangleAlert className="h-3.5 w-3.5" /> : null}{filter.label}</button>)}</div>;
}