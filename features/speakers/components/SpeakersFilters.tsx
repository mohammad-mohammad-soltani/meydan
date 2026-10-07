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
            className={`inline-flex h-[34px] shrink-0 items-center rounded-pill border px-4 text-[12.5px] font-bold transition-colors ${
              active
                ? "border-transparent bg-[var(--m-tx)] text-[var(--m-bg)]"
                : "border-[var(--m-line)] bg-[var(--m-soft)] text-[var(--m-mu)] hover:bg-hover"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
