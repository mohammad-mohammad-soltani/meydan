"use client";

import { Filter, LoaderCircle, MapPin } from "lucide-react";
import { MapSelector } from "./MapSelector";
import { CitySelector } from "./CitySelector";
import { MapFrame } from "./MapFrame";
import { useMap } from "../hooks/useMap";

export function MapView() {
  const map = useMap();
  return (
    <section id="view-map" className="min-h-full space-y-4 bg-background p-4 text-foreground">
      <section className="space-y-3 rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <h1 className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Filter className="h-4 w-4 text-brand" />
            انتخاب استان و میدان
          </h1>
          <span className="inline-flex items-center gap-1 rounded-pill border border-danger-border bg-danger-surface px-2 py-0.5 text-[10px] font-bold text-danger">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-danger" />
            لایو تجمعات فعال
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MapSelector provinces={map.visibleProvinces} selectedProvinceId={map.selectedProvinceId} query={map.provinceQuery} onQueryChange={map.setProvinceQuery} onSelect={map.selectProvince} />
          <CitySelector cities={map.visibleCities} selectedCityId={map.selectedCityId} query={map.cityQuery} onQueryChange={map.setCityQuery} onSelect={map.selectCity} />
        </div>
      </section>

      <MapFrame
        selectedSquares={map.squares}
        aggregates={map.aggregates}
        center={map.center}
        onSelectProvince={map.selectProvince}
      />

      {map.status === "loading" ? (
        <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-card px-4 py-4 text-xs text-muted-foreground shadow-xs">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          در حال دریافت میدان‌ها…
        </div>
      ) : map.selectedProvince ? (
        <section className="space-y-2 rounded-card border border-border bg-card p-3 text-card-foreground shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
              <MapPin className="h-4 w-4 text-brand" />
              میادین فعال استان{" "}
              <span className="text-brand">
                {map.selectedProvince.name}
                {map.selectedCity ? " · " + map.selectedCity.name : ""}
              </span>
            </h2>
            <span className="text-[10px] text-muted-foreground">
              {map.citySquares.length.toLocaleString("fa-IR")} میدان فعال
            </span>
          </div>
          {map.status === "error" ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] text-danger">{map.error}</p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {map.squares.length.toLocaleString("fa-IR")} میدان در کل کشور روی نقشه مشخص است.
          </p>
          {map.citySquares.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {map.citySquares.map((square) => (
                <li key={square.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-hover">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
                  <span className="truncate font-bold text-foreground">{square.name}</span>
                  <span className="mr-auto text-[10px] tabular-nums text-muted-foreground">
                    {square.latitude.toFixed(4)}، {square.longitude.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          ) : map.status === "ready" ? (
            <p className="mt-1 text-[11px] text-muted-foreground">میدان فعالی در این شهر ثبت نشده است.</p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
