"use client";

import { useEffect, useMemo, useState } from "react";
import { getCities, getCityMap, getProvinces } from "../services/map.service";
import type { MapLocation, MapStatus } from "../types";

export function useMap() {
  const [provinces, setProvinces] = useState<import("../types").Province[]>([]);
  const [provinceCities, setProvinceCities] = useState<import("../types").City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const selectedProvince = provinces.find((province) => province.id === selectedProvinceId) ?? provinces[0];
  const selectedCity = provinceCities.find((city) => city.id === selectedCityId) ?? provinceCities[0];
  const visibleProvinces = useMemo(() => provinces.filter((province) => province.name.includes(provinceQuery.trim())), [provinceQuery, provinces]);
  const visibleCities = useMemo(() => provinceCities.filter((city) => city.name.includes(cityQuery.trim())), [cityQuery, provinceCities]);

  useEffect(() => { void getProvinces().then((items) => { setProvinces(items); setSelectedProvinceId(items[0]?.id || 0); }).catch(() => setError("دریافت استان‌ها با خطا مواجه شد.")); }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    void getCities(selectedProvinceId).then((items) => { setProvinceCities(items); setSelectedCityId(items[0]?.id || 0); }).catch(() => setError("دریافت شهرها با خطا مواجه شد."));
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedCity) return;
    let active = true;
    queueMicrotask(() => active && setStatus("loading"));
    void getCityMap(selectedCity.id)
      .then(({ location: nextLocation, activeCount: count }) => {
        if (!active) return;
        setLocation(nextLocation);
        setActiveCount(count);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLocation(null);
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "موقعیت پیدا نشد.");
      });

    return () => { active = false; };
  }, [selectedCity]);

  const selectProvince = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedCityId(0);
    setCityQuery("");
  };

  const selectCity = (cityId: number) => setSelectedCityId(cityId);

  return { selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities, visibleProvinces, visibleCities, provinceQuery, cityQuery, location, status, error, activeCount, selectProvince, selectCity, setProvinceQuery, setCityQuery };
}
