"use client";

import { LoaderCircle, MapPin } from "lucide-react";
import type { City, MapFocusRequest, Province, SelectedLocation } from "@/features/map/types";
import { LocationPickerMap } from "@/features/map/components/LocationPickerMap";
import { ProvinceCitySelect } from "./ProvinceCitySelect";

export function SquareLocationField({
  provinces,
  cities,
  provinceId,
  cityId,
  provincesLoading,
  citiesLoading,
  onProvinceChange,
  onCityChange,
  location,
  resolving,
  error,
  focusRequest,
  onSelect,
  onPendingChange,
}: {
  provinces: Province[];
  cities: City[];
  provinceId: number | null;
  cityId: number | null;
  provincesLoading: boolean;
  citiesLoading: boolean;
  onProvinceChange: (provinceId: number | null) => void;
  onCityChange: (cityId: number | null) => void;
  location: SelectedLocation | null;
  resolving: boolean;
  error: string | null;
  focusRequest: MapFocusRequest | null;
  onSelect: (location: SelectedLocation) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const hasAddress = !!location?.address.trim();

  return (
    <section className="space-y-4 rounded-card border border-border bg-surface-muted p-4">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
          <MapPin aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-black text-foreground">موقعیت میدان</p>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            استان و شهر را انتخاب کنید، سپس روی نقشه بزنید تا موقعیت دقیق میدان ثبت شود.
          </p>
        </div>
      </div>

      <ProvinceCitySelect
        provinces={provinces}
        cities={cities}
        provinceId={provinceId}
        cityId={cityId}
        provincesLoading={provincesLoading}
        citiesLoading={citiesLoading}
        onProvinceChange={onProvinceChange}
        onCityChange={onCityChange}
      />

      {error ? (
        <p role="alert" className="text-[11px] font-bold leading-6 text-danger">
          {error}
        </p>
      ) : null}

      <LocationPickerMap
        focusRequest={focusRequest}
        onSelect={onSelect}
        onPendingChange={onPendingChange}
        heightClassName="h-64 sm:h-72"
      />

      <label className="block" dir="rtl">
        <span className="flex items-center justify-between gap-3 text-xs font-black text-foreground-secondary">
          <span>آدرس</span>
          {resolving ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="h-3 w-3 animate-spin" />
              در حال تشخیص…
            </span>
          ) : null}
        </span>
        <input
          className="mt-2 min-h-12 w-full cursor-default rounded-control border border-input-border bg-surface-muted px-3.5 text-sm text-foreground-secondary shadow-xs outline-none"
          value={location?.address ?? ""}
          placeholder="با انتخاب نقطه روی نقشه به‌صورت خودکار پر می‌شود"
          readOnly
          aria-live="polite"
          aria-readonly="true"
          tabIndex={-1}
          dir="rtl"
        />
        {!hasAddress && !resolving ? (
          <span className="mt-1.5 block text-[10px] leading-5 text-muted-foreground">
            نشانی به‌صورت خودکار از روی نقطه‌ی انتخاب‌شده روی نقشه خوانده می‌شود و قابل ویرایش نیست.
          </span>
        ) : null}
      </label>
    </section>
  );
}
