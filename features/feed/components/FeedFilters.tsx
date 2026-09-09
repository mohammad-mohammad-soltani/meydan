import { BellRing, Image, Mic, Newspaper, Star } from "lucide-react";
import type { FeedFilter } from "../types";

type FeedFiltersProps = {
  activeFilter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

const filters: Array<{ id: FeedFilter; label: string; icon?: "star" | "newspaper" | "image" | "mic" | "bell" }> = [
  { id: "all", label: "همه روایت‌ها" },
  { id: "ideas", label: "پژواک (کار خوب)", icon: "star" },
  { id: "media", label: "بازنشر رسانه‌ای", icon: "newspaper" },
  { id: "visual", label: "عکس و ویدیو", icon: "image" },
  { id: "audio", label: "صوت و سخنرانی", icon: "mic" },
  { id: "initiatives", label: "فراخوان‌ها", icon: "bell" },
];

const filterIcons = { star: Star, newspaper: Newspaper, image: Image, mic: Mic, bell: BellRing };

export function FeedFilters({ activeFilter, onChange }: FeedFiltersProps) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto border-b border-border bg-surface px-3 py-2.5 no-scrollbar">
      {filters.map((filter) => {
        const Icon = filter.icon ? filterIcons[filter.icon] : null;
        const active = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.id)}
            className={`inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-pill border px-3 py-1 text-center text-[10px] font-black transition-colors ${active ? "border-brand-border bg-selected text-selected-foreground" : "border-border bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"}`}
          >
            {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${filter.icon === "star" ? "text-warning" : ""}`} /> : null}
            <span className="whitespace-nowrap">{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
