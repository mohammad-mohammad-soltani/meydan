"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProvince, getCitiesByProvinceId, getDefaultCityForProvince, getProvinceById, provinces } from "../data/iran-cities";
import { geocodeLocation } from "../services/geocoding.service";
import type { City, MapLocation, MapStatus } from "../types";

export function useMap() {
  const initialProvince = defaultProvince;
  const initialCity = getDefaultCityForProvince(initialProvince.id);
  const [selectedProvinceId, setSelectedProvinceId] = useState(initialProvince.id);
  const [selectedCityId, setSelectedCityId] = useState(initialCity?.id ?? 0);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedProvince = getProvinceById(selectedProvinceId) ?? initialProvince;
  const provinceCities = useMemo(() => getCitiesByProvinceId(selectedProvince.id), [selectedProvince.id]);
  const selectedCity = provinceCities.find((city) => city.id === selectedCityId) ?? provinceCities[0];
  const visibleProvinces = useMemo(() => provinces.filter((province) => province.name.includes(provinceQuery.trim())), [provinceQuery]);
  const visibleCities = useMemo(() => provinceCities.filter((city) => city.name.includes(cityQuery.trim())), [cityQuery, provinceCities]);

  useEffect(() => {
    if (!selectedCity) return;
    let active = true;
    setStatus("loading");
    setError(null);

    void geocodeLocation({ city: selectedCity.name, province: selectedProvince.name })
      .then((nextLocation) => {
        if (!active) return;
        setLocation(nextLocation);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLocation(null);
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "موقعیت پیدا نشد.");
      });

    return () => { active = false; };
  }, [selectedCity?.id, selectedCity?.name, selectedProvince.name]);

  const selectProvince = (provinceId: number) => {
    const city = getDefaultCityForProvince(provinceId);
    setSelectedProvinceId(provinceId);
    setSelectedCityId(city?.id ?? 0);
    setCityQuery("");
  };

  const selectCity = (cityId: number) => setSelectedCityId(cityId);

  return { selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities, visibleProvinces, visibleCities, provinceQuery, cityQuery, location, status, error, selectProvince, selectCity, setProvinceQuery, setCityQuery };
}