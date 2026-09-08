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

const filterIcons = {
  star: Star,
  newspaper: Newspaper,
  image: Image,
  mic: Mic,
  bell: BellRing,
};

export function FeedFilters({ activeFilter, onChange }: FeedFiltersProps) {
  return (
    <div className="feed-filter-strip flex w-full gap-2 overflow-x-auto border-b border-slate-200 px-3 py-1.5 no-scrollbar dark:border-slate-800">
      {filters.map((filter) => {
        const Icon = filter.icon ? filterIcons[filter.icon] : null;
        return <button key={filter.id} id={"pill-" + filter.id} type="button" onClick={() => onChange(filter.id)} className={"feed-filter-pill pill-tab inline-flex shrink-0 items-center justify-center gap-1 rounded-full border px-3 py-1 text-center text-[10px] font-black transition " + (activeFilter === filter.id ? "active-pill" : "")}>{Icon ? <Icon className={"h-3.5 w-3.5 shrink-0 " + (filter.icon === "star" ? "fill-amber-400 text-amber-400" : "")} /> : null}<span className="whitespace-nowrap">{filter.label}</span></button>;
      })}
    </div>
  );
}
