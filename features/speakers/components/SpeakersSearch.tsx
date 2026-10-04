import { Search, X } from "lucide-react";

type SpeakersSearchProps = { value: string; onChange: (value: string) => void };

export function SpeakersSearch({ value, onChange }: SpeakersSearchProps) {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-icon-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="جستجوی نام استاد، موضوع سخنرانی یا شهر…"
        aria-label="جستجوی سخنران"
        className="h-[46px] w-full rounded-pill border border-input-border bg-input pl-10 pr-10 text-[14.5px] text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="پاک کردن جستجو"
          className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-icon-muted transition-colors hover:bg-hover hover:text-brand"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
