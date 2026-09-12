import type { SpeakerCategory, SpeakerFilter } from "../types";

type SpeakersFiltersProps = {
  activeFilter: SpeakerFilter;
  onChange: (filter: SpeakerFilter) => void;
  options: SpeakerCategory[];
};

/** Chips come from the API so admin-added or renamed categories appear without a deploy. */
export function SpeakersFilters({ activeFilter, onChange, options }: SpeakersFiltersProps) {
  if (options.length === 0) return null;

  const chips: Array<{ id: SpeakerFilter; label: string }> = [
    { id: "all", label: "همه" },
    ...options.map((option) => ({ id: option.slug, label: option.name })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto py-0.5 no-scrollbar" role="group" aria-label="فیلتر دسته‌بندی سخنرانان">
      {chips.map((chip) => {
        const active = activeFilter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.id)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-pill border px-3.5 py-1.5 text-[11px] font-black transition-colors ${
              active
                ? "border-brand bg-brand text-brand-foreground shadow-xs"
                : "border-border bg-surface text-muted-foreground hover:border-brand-border hover:bg-hover hover:text-foreground"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
