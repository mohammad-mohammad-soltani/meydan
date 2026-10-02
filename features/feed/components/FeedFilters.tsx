import { Sparkles, Video, type LucideIcon } from "lucide-react";
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

const filters: FilterItem[] = [
  { id: "all", label: "همه" },
  { id: "narratives", label: "روایت" },
  { id: "initiatives", label: "کار", icon: Sparkles },
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
        const active = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.id)}
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
