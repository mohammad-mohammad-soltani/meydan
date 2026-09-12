"use client";

import { useCallback, useEffect, useState } from "react";
import type { City, Province } from "@/features/map/types";
import { loadCities, loadProvinces } from "../services/geo-options.service";

/**
 * Province and city dropdown state. The ids are the backend's own geo ids —
 * the same ones `/geo/reverse` returns — so they can be submitted directly.
 *
 * Cities are stored together with the province they belong to. Changing the
 * province therefore hides the stale list during render, instead of clearing
 * it from an effect (which would cascade an extra render).
 */
type CityListState = { provinceId: number | null; items: City[] };

export function useProvinceCity() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cityList, setCityList] = useState<CityListState>({ provinceId: null, items: [] });
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadProvinces()
      .then((items) => {
        if (active) setProvinces(items);
      })
      .catch(() => {
        if (active) setError("دریافت فهرست استان‌ها ممکن نشد.");
      })
      .finally(() => {
        if (active) setProvincesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (provinceId === null) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setCitiesLoading(true);
    });
    void loadCities(provinceId)
      .then((items) => {
        if (active) setCityList({ provinceId, items });
      })
      .catch(() => {
        if (active) {
          setCityList({ provinceId, items: [] });
          setError("دریافت شهرهای این استان ممکن نشد.");
        }
      })
      .finally(() => {
        if (active) setCitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provinceId]);

  // Only the current province's cities are exposed; a list fetched for a
  // previously selected province is stale and reads as empty.
  const cities = cityList.provinceId === provinceId ? cityList.items : [];

  // Changing the province invalidates the chosen city.
  const selectProvince = useCallback((nextProvinceId: number | null) => {
    setProvinceId(nextProvinceId);
    setCityId(null);
    setError(null);
  }, []);

  const selectCity = useCallback((nextCityId: number | null) => {
    setCityId(nextCityId);
  }, []);

  return {
    provinces,
    cities,
    provinceId,
    cityId,
    provincesLoading,
    citiesLoading,
    error,
    selectProvince,
    selectCity,
  };
}
