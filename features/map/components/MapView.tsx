"use client";

import {
  ChevronLeft,
  LoaderCircle,
  MapPinned,
  MapPin,
} from "lucide-react";
import { MapSelector } from "./MapSelector";
import { CitySelector } from "./CitySelector";
import { MapFrame } from "./MapFrame";
import { useMap } from "../hooks/useMap";

export function MapView() {
  const map = useMap();

  return (
    <section
      id="view-map"
      className="min-h-full bg-background pb-24 text-foreground"
    >
      <div className="border-b border-divider bg-surface px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-sm font-black text-foreground">
              <MapPinned className="h-[18px] w-[18px] shrink-0 text-brand" />
              نقشه میدان‌ها
            </h1>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              استان و شهر را انتخاب کنید تا میدان‌های فعال همان محدوده را ببینید.
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-danger-surface px-2.5 py-1 text-[10px] font-black text-danger">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
            </span>
            لایو
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
          <MapSelector
            provinces={map.visibleProvinces}
            selectedProvinceId={map.selectedProvinceId}
            query={map.provinceQuery}
            onQueryChange={map.setProvinceQuery}
            onSelect={map.selectProvince}
          />

          <CitySelector
            cities={map.visibleCities}
            selectedCityId={map.selectedCityId}
            query={map.cityQuery}
            onQueryChange={map.setCityQuery}
            onSelect={map.selectCity}
          />
        </div>
      </div>

      <div className="pt-3 sm:px-4">
        <div className="relative overflow-hidden border-y border-border bg-[#171a1b] shadow-sm sm:rounded-[22px] sm:border">
          <div className="min-h-[430px] sm:min-h-[500px] [&>*]:min-h-[430px] sm:[&>*]:min-h-[500px]">
            <MapFrame
              selectedSquares={map.squares}
              aggregates={map.aggregates}
              center={map.center}
              onSelectProvince={map.selectProvince}
            />
          </div>

          {map.status === "loading" ? (
            <div className="absolute inset-0 z-[700] grid place-items-center bg-black/30 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#2a2b2c]/90 px-4 py-2 text-xs font-bold text-white shadow-card backdrop-blur-md">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#e5544b]" />
                در حال دریافت میدان‌ها…
              </div>
            </div>
          ) : null}

          {map.status === "error" ? (
            <div className="absolute inset-x-3 bottom-3 z-[700] rounded-[14px] border border-danger-border bg-danger-surface px-3 py-2.5 text-[11px] leading-5 text-danger shadow-sm">
              {map.error}
            </div>
          ) : null}
        </div>
      </div>

      {map.selectedProvince ? (
        <section className="mt-5 border-y border-divider bg-surface">
          <div className="px-3 py-4 sm:px-4">
            <div className="flex items-start justify-between gap-3" dir="rtl">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-muted text-brand">
                    <MapPin className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-foreground">
                      {map.selectedProvince.name}
                      {map.selectedCity ? ` · ${map.selectedCity.name}` : ""}
                    </h2>

                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      میدان‌های فعال در محدوده انتخاب‌شده
                    </p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-left">
                <strong className="block text-base font-black text-foreground">
                  {map.citySquares.length.toLocaleString("fa-IR")}
                </strong>
                <span className="text-[10px] text-muted-foreground">
                  میدان فعال
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-divider pt-3 text-[10px] text-muted-foreground">
              <span>
                {map.squares.length.toLocaleString("fa-IR")} میدان روی نقشه کشور
              </span>
              <span className="inline-flex items-center gap-1 text-brand">
                مشاهده روی نقشه
                <ChevronLeft className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {map.citySquares.length > 0 ? (
            <ul className="divide-y divide-divider border-t border-divider">
              {map.citySquares.map((square) => (
                <li
                  key={square.id}
                  className="group flex min-h-14 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-hover sm:px-4"
                  dir="rtl"
                >
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-15 transition group-hover:opacity-25" />
                    <span className="relative m-auto h-2 w-2 rounded-full bg-danger" />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-[12px] font-black text-foreground">
                    {square.name}
                  </span>

                  <span
                    className="shrink-0 text-[9px] tabular-nums text-foreground-subtle"
                    dir="ltr"
                  >
                    {square.latitude.toFixed(4)}, {square.longitude.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          ) : map.status === "ready" ? (
            <div className="border-t border-divider px-4 py-8 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-icon-muted">
                <MapPin className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3 text-xs font-bold text-foreground-secondary">
                میدان فعالی در این محدوده ثبت نشده است.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                شهر یا استان دیگری را از بالای صفحه انتخاب کنید.
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="px-4 py-5 text-center">
          <p className="text-[11px] leading-6 text-muted-foreground">
            برای مشاهده جزئیات میدان‌ها، یک استان را انتخاب کنید.
          </p>
        </div>
      )}
    </section>
  );
}
