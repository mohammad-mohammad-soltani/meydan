"use client";

import { Filter } from "lucide-react";
import { MapSelector } from "./MapSelector";
import { CitySelector } from "./CitySelector";
import { LocationPreview } from "./LocationPreview";
import { MapFrame } from "./MapFrame";
import { useMap } from "../hooks/useMap";

export function MapView() {
  const map = useMap();
  return (
    <section id="view-map" className="min-h-full space-y-4 bg-background p-4 text-foreground">
      <section className="space-y-3 rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h1 className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground"><Filter className="h-4 w-4 text-brand" />انتخاب استان و میدان</h1>
          <span className="inline-flex items-center gap-1 rounded-pill border border-danger-border bg-danger-surface px-2 py-0.5 text-[10px] font-bold text-danger"><span className="h-1.5 w-1.5 animate-ping rounded-full bg-danger" />لایو تجمعات فعال</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MapSelector provinces={map.visibleProvinces} selectedProvinceId={map.selectedProvinceId} query={map.provinceQuery} onQueryChange={map.setProvinceQuery} onSelect={map.selectProvince} />
          <CitySelector cities={map.visibleCities} selectedCityId={map.selectedCityId} query={map.cityQuery} onQueryChange={map.setCityQuery} onSelect={map.selectCity} />
        </div>
      </section>
      <MapFrame location={map.location} />
      <LocationPreview province={map.selectedProvince} city={map.selectedCity} location={map.location} status={map.status} error={map.error} />
    </section>
  );
}
