import { Search } from "lucide-react";

type SpeakersSearchProps = { value: string; onChange: (value: string) => void; };

export function SpeakersSearch({ value, onChange }: SpeakersSearchProps) {
  return <label className="relative block"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="جستجوی نام استاد، موضوع سخنرانی یا شهر..." className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 pl-3 pr-9 text-xs text-slate-800 outline-none transition focus:border-brand-red dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" /></label>;
}