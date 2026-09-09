import { CalendarDays, Headphones, Sparkles, TextQuote } from "lucide-react";
import type { ContentCategory } from "../types";

type ContentTabsProps = { activeCategory: ContentCategory; onChange: (category: ContentCategory) => void; };

const tabs: Array<{ id: ContentCategory; label: string; icon: typeof Sparkles }> = [
  { id: "featured", label: "ویژه", icon: Sparkles },
  { id: "talks", label: "منبر", icon: TextQuote },
  { id: "audio", label: "صوت", icon: Headphones },
  { id: "schedule", label: "روزشمار", icon: CalendarDays },
];

export function ContentTabs({ activeCategory, onChange }: ContentTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-divider px-4 py-3 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeCategory === tab.id;
        return <button key={tab.id} type="button" aria-pressed={active} onClick={() => onChange(tab.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-black transition-colors ${active ? "bg-brand text-brand-foreground shadow-xs" : "bg-surface-muted text-muted-foreground hover:bg-hover hover:text-foreground"}`}><Icon className="h-4 w-4" />{tab.label}</button>;
      })}
    </div>
  );
}
