"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { LocationPickerMap } from "@/features/map/components/LocationPickerMap";
import type { SelectedLocation } from "@/features/map/types";
import { getCities, getProvinces } from "../services/programs.service";
import type { GeoOption } from "../types";
import { AdminField } from "./AdminField";
import { fieldClass } from "./styles";

/** True when a map click produced a usable point. */
function hasPoint(
  location: { latitude: number | null; longitude: number | null } | null | undefined,
): location is { latitude: number; longitude: number } {
  return Boolean(
    location &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      Math.abs(location.latitude as number) <= 90 &&
      Math.abs(location.longitude as number) <= 180 &&
      !(location.latitude === 0 && location.longitude === 0),
  );
}

export type GeoValue = {
  provinceId: number | null;
  cityId: number | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export const EMPTY_GEO: GeoValue = {
  provinceId: null,
  cityId: null,
  address: "",
  latitude: null,
  longitude: null,
};

/**
 * Province + city + address + coordinates.
 *
 * The backend's `SquareAdminService` demands all five together to move a
 * square, and it silently substitutes Tehran's centre for a missing
 * coordinate — so this field is the only place that guarantees the five travel
 * as a set. Cities come from `/geo/cities?province_id=` and the backend
 * validates membership in the province and `active = 1` on write.
 */
export function GeoPickerField({
  idPrefix = "geo",
  value,
  onChange,
  errors,
  disabled = false,
  showMap = true,
}: {
  idPrefix?: string;
  value: GeoValue;
  onChange: (value: GeoValue) => void;
  /** Per-field Persian messages, keyed like the API's `error.fields`. */
  errors?: Record<string, string | undefined>;
  disabled?: boolean;
  showMap?: boolean;
}) {
  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [cities, setCities] = useState<GeoOption[]>([]);
  // Loading is derived, not stored: a synchronous `setLoading(true)` inside the
  // fetch effect would be a state update during render's own effect pass.
  const [provincesLoaded, setProvincesLoaded] = useState(false);
  const [citiesLoadedFor, setCitiesLoadedFor] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const provincesLoading = !provincesLoaded && !loadError;
  const citiesLoading = Boolean(value.provinceId) && citiesLoadedFor !== value.provinceId;
  const [pendingPoint, setPendingPoint] = useState(false);

  useEffect(() => {
    let active = true;
    void getProvinces()
      .then((items) => {
        if (!active) return;
        setProvinces(items ?? []);
        setProvincesLoaded(true);
      })
      .catch(() => {
        if (active) setLoadError("دریافت فهرست استان‌ها ممکن نشد.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const provinceId = value.provinceId;
    if (!provinceId) return;

    let active = true;
    void getCities(provinceId)
      .then((items) => {
        if (!active) return;
        setCities(items ?? []);
        setCitiesLoadedFor(provinceId);
      })
      .catch(() => {
        if (!active) return;
        setCities([]);
        setCitiesLoadedFor(provinceId);
      });
    return () => {
      active = false;
    };
  }, [value.provinceId]);

  const initialLocation = useMemo(
    () =>
      hasPoint(value)
        ? {
            latitude: value.latitude as number,
            longitude: value.longitude as number,
            address: value.address,
            provinceId: value.provinceId,
            cityId: value.cityId,
            provinceName: null,
            cityName: null,
          }
        : null,
    [value],
  );

  /** A map click reverse-geocodes and fills province, city and address at once. */
  const applyPicked = (picked: SelectedLocation) => {
    setPendingPoint(false);
    onChange({
      provinceId: picked.provinceId ?? value.provinceId,
      cityId: picked.cityId ?? null,
      address: picked.address || value.address,
      latitude: picked.latitude,
      longitude: picked.longitude,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="استان" htmlFor={`${idPrefix}-province`} error={errors?.province_id} required>
          <select
            id={`${idPrefix}-province`}
            value={value.provinceId ?? ""}
            disabled={disabled || provincesLoading}
            aria-invalid={errors?.province_id ? true : undefined}
            onChange={(event) => {
              const next = event.target.value ? Number(event.target.value) : null;
              // Changing the province invalidates the city: the backend
              // rejects a city that does not belong to it.
              onChange({ ...value, provinceId: next, cityId: null });
            }}
            className={fieldClass}
          >
            <option value="">
              {provincesLoading ? "در حال دریافت…" : "انتخاب استان"}
            </option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField
          label="شهر"
          htmlFor={`${idPrefix}-city`}
          error={errors?.city_id}
          hint="پس از انتخاب استان، شهر را انتخاب کنید."
          required
        >
          <select
            id={`${idPrefix}-city`}
            value={value.cityId ?? ""}
            disabled={disabled || !value.provinceId || citiesLoading}
            aria-invalid={errors?.city_id ? true : undefined}
            onChange={(event) =>
              onChange({ ...value, cityId: event.target.value ? Number(event.target.value) : null })
            }
            className={fieldClass}
          >
            <option value="">
              {!value.provinceId
                ? "ابتدا استان را انتخاب کنید"
                : citiesLoading
                  ? "در حال دریافت…"
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
        </AdminField>
      </div>

      <AdminField label="نشانی" htmlFor={`${idPrefix}-address`} error={errors?.address} required>
        <textarea
          id={`${idPrefix}-address`}
          value={value.address}
          rows={2}
          disabled={disabled}
          aria-invalid={errors?.address ? true : undefined}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          placeholder="نشانی دقیق میدان"
          className={`${fieldClass} resize-none`}
        />
      </AdminField>

      {showMap ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-foreground-secondary">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-brand" />
            موقعیت روی نقشه
          </p>
          <LocationPickerMap
            initialLocation={initialLocation}
            onSelect={applyPicked}
            onPendingChange={setPendingPoint}
            heightClassName="h-64"
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="عرض جغرافیایی"
          htmlFor={`${idPrefix}-lat`}
          error={errors?.latitude}
          hint="با انتخاب نقطه روی نقشه، مختصات خودکار تکمیل می‌شود. اگر خالی بماند، مرکز تهران ثبت می‌شود."
        >
          <input
            id={`${idPrefix}-lat`}
            value={value.latitude ?? ""}
            disabled={disabled}
            inputMode="decimal"
            dir="ltr"
            aria-invalid={errors?.latitude ? true : undefined}
            onChange={(event) =>
              onChange({
                ...value,
                latitude: event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className={`${fieldClass} text-left`}
          />
        </AdminField>

        <AdminField label="طول جغرافیایی" htmlFor={`${idPrefix}-lng`} error={errors?.longitude}>
          <input
            id={`${idPrefix}-lng`}
            value={value.longitude ?? ""}
            disabled={disabled}
            inputMode="decimal"
            dir="ltr"
            aria-invalid={errors?.longitude ? true : undefined}
            onChange={(event) =>
              onChange({
                ...value,
                longitude: event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className={`${fieldClass} text-left`}
          />
        </AdminField>
      </div>

      {pendingPoint ? (
        <p role="status" className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="h-3 w-3 animate-spin" />
          در حال تشخیص آدرس نقطه انتخاب‌شده…
        </p>
      ) : null}

      {loadError ? (
        <p role="alert" className="text-[10px] font-bold text-danger-foreground">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
