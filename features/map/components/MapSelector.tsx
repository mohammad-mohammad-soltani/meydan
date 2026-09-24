import { MapPinned, Search } from "lucide-react";
import type { Province } from "../types";

type MapSelectorProps = { provinces: Province[]; selectedProvinceId: number; query: string; onQueryChange: (value: string) => void; onSelect: (provinceId: number) => void; };

export function MapSelector({ provinces, selectedProvinceId, query, onQueryChange, onSelect }: MapSelectorProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-muted-foreground">استان</span>
      <div className="rounded-control border border-input-border bg-input p-2 transition-colors hover:border-input-border-hover">
        <div className="flex items-center gap-1.5 border-b border-divider pb-2 text-icon-muted">
          <Search className="h-3.5 w-3.5" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="جست‌وجوی استان..." className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-placeholder" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <MapPinned className="h-4 w-4 text-brand" />
          <select value={selectedProvinceId || ""} onChange={(event) => event.target.value && onSelect(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent text-xs font-bold text-foreground outline-none">
            <option value="" disabled>انتخاب استان</option>
            {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
          </select>
        </div>
      </div>
    </label>
  );
}
