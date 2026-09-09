import { Megaphone, Radio, Sparkles } from "lucide-react";
import type { SpeakerFilter } from "../types";

type SpeakersFiltersProps = { activeFilter: SpeakerFilter; onChange: (filter: SpeakerFilter) => void; };

const filters: Array<{ id: SpeakerFilter; label: string; icon?: typeof Sparkles }> = [
  { id: "all", label: "همه" },
  { id: "faith", label: "معارف", icon: Sparkles },
  { id: "media", label: "رسانه", icon: Radio },
  { id: "resistance", label: "مقاومت", icon: Megaphone },
];

export function SpeakersFilters({ activeFilter, onChange }: SpeakersFiltersProps) {
  return <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">{filters.map((filter) => { const Icon = filter.icon; const active = activeFilter === filter.id; return <button key={filter.id} type="button" aria-pressed={active} onClick={() => onChange(filter.id)} className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[11px] font-black transition-colors ${active ? "border-brand-border bg-selected text-selected-foreground" : "border-border bg-surface text-muted-foreground hover:bg-hover hover:text-foreground"}`}>{Icon ? <Icon className="h-3.5 w-3.5" /> : null}{filter.label}</button>; })}</div>;
}
