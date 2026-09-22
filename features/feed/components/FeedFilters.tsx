import { Layers3, Radio, Sparkles, type LucideIcon } from "lucide-react";
import type { FeedFilter } from "../types";

type FeedFiltersProps = {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

type FilterItem = {
  id: FeedFilter;
  label: string;
  icon: LucideIcon;
};

const filters: FilterItem[] = [
  {
    id: "all",
    label: "همه روایت‌ها",
    icon: Layers3,
  },
  {
    id: "initiatives",
    label: "کار خوب",
    icon: Sparkles,
  },
  {
    id: "reflected",
    label: "بازنشر رسانه‌ای",
    icon: Radio,
  },
];

export function FeedFilters({
  activeFilter,
  onChange,
}: FeedFiltersProps) {
  return (
    <div
      dir="rtl"
      className="flex w-full gap-1.5 overflow-x-auto border-b border-divider bg-surface px-3 py-2 no-scrollbar"
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
            className={`
              group inline-flex min-h-9 shrink-0 items-center justify-center
              gap-1.5 rounded-full border px-3.5 py-1.5
              text-[11px] font-bold
              transition-[background-color,border-color,color,transform]
              active:scale-[0.97]
              ${
                active
                  ? "border-brand-border bg-brand text-white "
                  : "border-border bg-surface text-muted-foreground hover:bg-hover hover:text-foreground"
              }
            `}
          >
            <Icon
              aria-hidden="true"
              strokeWidth={active ? 2.4 : 2}
              className={`
                h-[15px] w-[15px] shrink-0
                transition-[color,transform]
                group-hover:scale-105
                ${
                  active
                    ? "text-white"
                    : "text-icon-muted group-hover:text-icon"
                }
              `}
            />

            <span className="whitespace-nowrap">
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
