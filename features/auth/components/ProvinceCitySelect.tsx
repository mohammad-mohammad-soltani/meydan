"use client";

import { ChevronDown, LoaderCircle } from "lucide-react";
import type { City, Province } from "@/features/map/types";

const selectClass =
  "mt-2 min-h-12 w-full appearance-none rounded-control border border-input-border bg-input px-3.5 pl-10 text-sm font-bold text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] hover:border-input-border-hover focus:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-subtle";

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <span className="flex items-center justify-between gap-3 text-xs font-black text-foreground-secondary">
      <span>{text}</span>
      {hint ? <span className="text-[10px] font-medium text-muted-foreground">{hint}</span> : null}
    </span>
  );
}

export function ProvinceCitySelect({
  provinces,
  cities,
  provinceId,
  cityId,
  provincesLoading,
  citiesLoading,
  onProvinceChange,
  onCityChange,
}: {
  provinces: Province[];
  cities: City[];
  provinceId: number | null;
  cityId: number | null;
  provincesLoading: boolean;
  citiesLoading: boolean;
  onProvinceChange: (provinceId: number | null) => void;
  onCityChange: (cityId: number | null) => void;
}) {
  const cityDisabled = provinceId === null || citiesLoading;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block" dir="rtl">
        <Label text="استان" hint={provincesLoading ? "در حال دریافت…" : undefined} />
        <span className="relative block">
          <select
            className={selectClass}
            value={provinceId ?? ""}
            onChange={(event) =>
              onProvinceChange(event.target.value ? Number(event.target.value) : null)
            }
            disabled={provincesLoading}
            required
          >
            <option value="">انتخاب استان</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-icon-muted"
          />
        </span>
      </label>

      <label className="block" dir="rtl">
        <Label text="شهر" hint={citiesLoading ? "در حال دریافت…" : undefined} />
        <span className="relative block">
          <select
            className={selectClass}
            value={cityId ?? ""}
            onChange={(event) => onCityChange(event.target.value ? Number(event.target.value) : null)}
            disabled={cityDisabled}
            required
          >
            <option value="">
              {provinceId === null
                ? "ابتدا استان را انتخاب کنید"
                : cities.length
                  ? "انتخاب شهر"
                  : "شهری برای این استان ثبت نشده"}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {citiesLoading ? (
            <LoaderCircle
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 animate-spin text-icon-muted"
            />
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-icon-muted"
            />
          )}
        </span>
      </label>
    </div>
  );
}
