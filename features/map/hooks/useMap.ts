"use client";

import { useEffect, useMemo, useState } from "react";
import { meydanClientApi } from "@/lib/meydan-client-api";
import { geocodeLocation } from "../services/geocoding.service";
import type { City, MapLocation, MapStatus, Province } from "../types";

type ApiCity = { id: number; province_id: number; name: string };

export function useMap() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceCities, setProvinceCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void meydanClientApi<Province[]>("/geo/provinces")
      .then((items) => {
        if (!active) return;
        setProvinces(items);
        const preferred = items.find((item) => item.name === "تهران") ?? items[0];
        if (preferred) setSelectedProvinceId(preferred.id);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "دریافت استان‌ها ناموفق بود.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    let active = true;
    setStatus("loading");
    void meydanClientApi<ApiCity[]>(`/geo/cities?province_id=${selectedProvinceId}`)
      .then((items) => {
        if (!active) return;
        const mapped = items.map((item) => ({ id: item.id, name: item.name, provinceId: item.province_id }));
        setProvinceCities(mapped);
        const capital = mapped.find((item) => item.name === "تهران") ?? mapped[0];
        setSelectedCityId(capital?.id ?? 0);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setProvinceCities([]);
        setSelectedCityId(0);
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "دریافت شهرها ناموفق بود.");
      });
    return () => { active = false; };
  }, [selectedProvinceId]);

  const selectedProvince = provinces.find((province) => province.id === selectedProvinceId) ?? provinces[0] ?? { id: 0, name: "" };
  const selectedCity = provinceCities.find((city) => city.id === selectedCityId) ?? provinceCities[0];
  const visibleProvinces = useMemo(() => provinces.filter((province) => province.name.includes(provinceQuery.trim())), [provinceQuery, provinces]);
  const visibleCities = useMemo(() => provinceCities.filter((city) => city.name.includes(cityQuery.trim())), [cityQuery, provinceCities]);

  useEffect(() => {
    if (!selectedCity || !selectedProvince.id) return;
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
  }, [selectedCity, selectedProvince.id, selectedProvince.name]);

  const selectProvince = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedCityId(0);
    setCityQuery("");
  };

  const selectCity = (cityId: number) => setSelectedCityId(cityId);

  return { selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities, visibleProvinces, visibleCities, provinceQuery, cityQuery, location, status, error, selectProvince, selectCity, setProvinceQuery, setCityQuery };
}
