import { Newspaper, Star } from "lucide-react";
import type { FeedFilter } from "../types";

type FeedFiltersProps = {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

const filters: Array<{ id: FeedFilter; label: string; icon?: "star" | "newspaper" }> = [
  { id: "all", label: "همه روایت‌ها" },
  { id: "ideas", label: "پژواک (کار خوب)", icon: "star" },
  { id: "media", label: "بازنشر رسانه‌ای", icon: "newspaper" },
];

export function FeedFilters({ activeFilter, onChange }: FeedFiltersProps) {
  return (
    <div className="feed-filter-strip grid w-full grid-cols-3 gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
      {filters.map((filter) => (
        <button key={filter.id} id={"pill-" + filter.id} type="button" onClick={() => onChange(filter.id)} className={"feed-filter-pill pill-tab inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-2.5 text-center text-[11px] font-black transition sm:px-3 sm:text-xs " + (activeFilter === filter.id ? "active-pill" : "")}>
          {filter.icon === "star" ? <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /> : null}
          {filter.icon === "newspaper" ? <Newspaper className="h-4 w-4 shrink-0" /> : null}
          <span className="truncate">{filter.label}</span>
        </button>
      ))}
    </div>
  );
}
