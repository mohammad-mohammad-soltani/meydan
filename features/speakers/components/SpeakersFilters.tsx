"use client";

import { useRef } from "react";
import type { SpeakerCategory, SpeakerFilter } from "../types";

type SpeakersFiltersProps = {
  activeFilter: SpeakerFilter;
  onChange: (filter: SpeakerFilter) => void;
  options: SpeakerCategory[];
};

/** Mouse drag-to-scroll for desktop; touch keeps its native swipe. */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  return {
    ref,
    onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      if (event.pointerType !== "mouse" || event.button !== 0 || !ref.current) return;
      drag.current = { active: true, moved: false, startX: event.clientX, startScroll: ref.current.scrollLeft };
    },
    onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      const state = drag.current;
      if (!state.active || !ref.current) return;
      const delta = event.clientX - state.startX;
      if (!state.moved && Math.abs(delta) < 4) return;
      state.moved = true;
      ref.current.scrollLeft = state.startScroll - delta;
    },
    onPointerUp() {
      drag.current.active = false;
    },
    onPointerLeave() {
      drag.current.active = false;
    },
    /** Swallow the click that ends a drag so a chip isn't selected by accident. */
    onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
      if (drag.current.moved) {
        event.stopPropagation();
        event.preventDefault();
        drag.current.moved = false;
      }
    },
  };
}

/** Chips come from the API so admin-added or renamed categories appear without a deploy. */
export function SpeakersFilters({ activeFilter, onChange, options }: SpeakersFiltersProps) {
  const dragScroll = useDragScroll();
  if (options.length === 0) return null;

  const chips: Array<{ id: SpeakerFilter; label: string }> = [
    { id: "all", label: "همه" },
    ...options.map((option) => ({ id: option.slug, label: option.name })),
  ];

  return (
    <div {...dragScroll} className="flex cursor-grab select-none gap-2 overflow-x-auto py-0.5 no-scrollbar active:cursor-grabbing" role="group" aria-label="فیلتر دسته‌بندی سخنرانان">
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
