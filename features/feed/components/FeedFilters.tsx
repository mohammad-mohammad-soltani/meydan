import { Send, Sparkles, Video, type LucideIcon } from "lucide-react";
import type { FeedFilter } from "../types";

type FeedFiltersProps = {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

type FilterItem = {
  id: FeedFilter;
  label: string;
  icon?: LucideIcon;
};

// The reference's four chips: «روایت» is the whole timeline, «پویش» has no feed filter yet.
const filters: Array<FilterItem | { id: null; label: string; icon: LucideIcon }> = [
  { id: "all", label: "روایت" },
  { id: "initiatives", label: "کار", icon: Sparkles },
  { id: null, label: "پویش", icon: Send },
  { id: "reflected", label: "پویش رسانه‌ای", icon: Video },
];

export function FeedFilters({
  activeFilter,
  onChange,
}: FeedFiltersProps) {
  return (
    <div
      dir="rtl"
      className="flex w-full items-center gap-2 overflow-x-auto bg-background px-3 py-2.5 no-scrollbar"
      aria-label="فیلتر روایت‌ها"
    >
      {filters.map((filter) => {
        const Icon = filter.icon;
        const active = activeFilter === filter.id || (filter.id === "all" && activeFilter === "narratives");
        if (filter.id === null) {
          return (
            <span key={filter.label} aria-disabled="true" title="به‌زودی" className="inline-flex shrink-0 cursor-default items-center gap-1.5 whitespace-nowrap rounded-full border border-input-border bg-surface-muted px-3.5 py-1.5 text-xs font-bold text-muted-foreground">
              {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
              {filter.label}
            </span>
          );
        }
        const id = filter.id;

        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors active:scale-[0.97] ${
              active
                ? "border-transparent bg-emphasis text-emphasis-foreground"
                : "border-input-border bg-surface-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
