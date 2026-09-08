import { Newspaper, Star } from "lucide-react";
import type { FeedFilter } from "../types";

type FeedFiltersProps = {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

const filters: Array<{ id: FeedFilter; label: string; icon?: "star" | "newspaper" }> = [
  { id: "all", label: "همه روایت‌ها" },
  { id: "ideas", label: "پژواک (کار خوب)", icon: "star" },
  { id: "media", label: "بازنشر رسانه‌ای", icon: "newspaper" }
];

export function FeedFilters({ activeFilter, onChange }: FeedFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {filters.map((filter) => (
        <button key={filter.id} id={"pill-" + filter.id} type="button" onClick={() => onChange(filter.id)} className={"pill-tab inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition " + (activeFilter === filter.id ? "active-pill" : "")}>
          {filter.icon === "star" ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : null}
          {filter.icon === "newspaper" ? <Newspaper className="h-4 w-4" /> : null}
          {filter.label}
        </button>
      ))}
    </div>
  );
}