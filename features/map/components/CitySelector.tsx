import { MapPin, Search } from "lucide-react";
import type { City } from "../types";

type CitySelectorProps = { cities: City[]; selectedCityId: number; query: string; onQueryChange: (value: string) => void; onSelect: (cityId: number) => void; };

export function CitySelector({ cities, selectedCityId, query, onQueryChange, onSelect }: CitySelectorProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-muted-foreground">شهر / میدان</span>
      <div className="rounded-control border border-input-border bg-input p-2 transition-colors hover:border-input-border-hover">
        <div className="flex items-center gap-1.5 border-b border-divider pb-2 text-icon-muted">
          <Search className="h-3.5 w-3.5" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="جست‌وجوی شهر..." className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-brand" />
          <select value={selectedCityId || ""} onChange={(event) => event.target.value && onSelect(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent text-xs font-bold text-foreground outline-none">
            <option value="" disabled>{cities.length ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </div>
      </div>
    </label>
  );
}
