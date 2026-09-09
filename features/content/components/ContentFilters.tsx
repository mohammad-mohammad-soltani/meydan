import { CheckCircle2, Filter, TriangleAlert } from "lucide-react";
import type { ContentFilter } from "../types";

type ContentFiltersProps = { activeFilter: ContentFilter; onChange: (filter: ContentFilter) => void; };

const filters: Array<{ id: ContentFilter; label: string; icon?: "ready" | "urgent" }> = [
  { id: "all", label: "همه" },
  { id: "ready", label: "آماده استفاده", icon: "ready" },
  { id: "urgent", label: "ضروری", icon: "urgent" },
];

export function ContentFilters({ activeFilter, onChange }: ContentFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      <Filter className="h-4 w-4 shrink-0 text-icon-muted" />
      {filters.map((filter) => {
        const active = activeFilter === filter.id;
        return (
          <button key={filter.id} type="button" aria-pressed={active} onClick={() => onChange(filter.id)} className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-pill border px-3 py-1.5 text-[11px] font-black transition-colors ${active ? "border-brand-border bg-selected text-selected-foreground" : "border-border bg-surface text-muted-foreground hover:bg-hover hover:text-foreground"}`}>
            {filter.icon === "ready" ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : null}
            {filter.icon === "urgent" ? <TriangleAlert className="h-3.5 w-3.5 text-warning" /> : null}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
