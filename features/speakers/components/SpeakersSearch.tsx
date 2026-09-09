import { Search } from "lucide-react";

type SpeakersSearchProps = { value: string; onChange: (value: string) => void; };

export function SpeakersSearch({ value, onChange }: SpeakersSearchProps) {
  return <label className="relative block"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-icon-muted" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="جستجوی نام استاد، موضوع سخنرانی یا شهر..." className="w-full rounded-control border border-input-border bg-input py-2 pl-3 pr-9 text-xs text-foreground outline-none transition-colors placeholder:text-placeholder hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring" /></label>;
}
