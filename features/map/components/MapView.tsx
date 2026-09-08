"use client";

import { Filter } from "lucide-react";
import { MapSelector } from "./MapSelector";
import { CitySelector } from "./CitySelector";
import { LocationPreview } from "./LocationPreview";
import { MapFrame } from "./MapFrame";
import { useMap } from "../hooks/useMap";

export function MapView() {
  const map = useMap();
  return <section id="view-map" className="min-h-full space-y-4 bg-white p-4 dark:bg-[#070a0f]"><section className="space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between"><h1 className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white"><Filter className="h-4 w-4 text-brand-red" />انتخاب استان و میدان</h1><span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-red"><span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand-red" />لایو تجمعات فعال</span></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><MapSelector provinces={map.visibleProvinces} selectedProvinceId={map.selectedProvinceId} query={map.provinceQuery} onQueryChange={map.setProvinceQuery} onSelect={map.selectProvince} /><CitySelector cities={map.visibleCities} selectedCityId={map.selectedCityId} query={map.cityQuery} onQueryChange={map.setCityQuery} onSelect={map.selectCity} /></div></section><MapFrame location={map.location} /><LocationPreview province={map.selectedProvince} city={map.selectedCity} location={map.location} status={map.status} error={map.error} /></section>;
}