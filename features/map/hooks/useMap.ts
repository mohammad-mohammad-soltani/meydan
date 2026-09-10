"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllSquares, getCities, getCityMap, getProvinces } from "../services/map.service";
import type { MapStatus } from "../types";
import type { ProvinceAggregate, SquareMarker } from "../services/map.service";

export function useMap() {
  const [provinces, setProvinces] = useState<import("../types").Province[]>([]);
  const [provinceCities, setProvinceCities] = useState<import("../types").City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState(0);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  // ALL squares across every city/province — always shown as red dots.
  const [allSquares, setAllSquares] = useState<SquareMarker[]>([]);
  // Squares of the selected city — only for the info list below the map.
  const [citySquares, setCitySquares] = useState<SquareMarker[]>([]);
  // Map focus: derived from the dropdown selection (null = fit all).
  const [focus, setFocus] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  const selectedProvince = provinces.find((province) => province.id === selectedProvinceId) ?? provinces[0];
  const selectedCity = provinceCities.find((city) => city.id === selectedCityId) ?? provinceCities[0];
  const visibleProvinces = useMemo(() => provinces.filter((province) => province.name.includes(provinceQuery.trim())), [provinceQuery, provinces]);
  const visibleCities = useMemo(() => provinceCities.filter((city) => city.name.includes(cityQuery.trim())), [cityQuery, provinceCities]);

  // Selected province → individual red dots. If markers carry no province
  // info (backend didn't provide it), show everything as individual dots
  // so nothing ever disappears from the map.
  const selectedSquares = useMemo(() => {
    if (!selectedProvinceId) return allSquares;
    if (!allSquares.some((square) => square.provinceId != null)) return allSquares;
    return allSquares.filter((square) => square.provinceId === selectedProvinceId);
  }, [allSquares, selectedProvinceId]);

  // Every other province → a single count badge at its center.
  const otherAggregates = useMemo<ProvinceAggregate[]>(() => {
    const grouped = new Map<number, { name: string; count: number; sumLat: number; sumLng: number }>();
    for (const square of allSquares) {
      if (square.provinceId == null || square.provinceId === selectedProvinceId) continue;
      const entry = grouped.get(square.provinceId) ?? {
        name: square.provinceName || "استان",
        count: 0,
        sumLat: 0,
        sumLng: 0,
      };
      entry.count += 1;
      entry.sumLat += square.latitude;
      entry.sumLng += square.longitude;
      if (square.provinceName) entry.name = square.provinceName;
      grouped.set(square.provinceId, entry);
    }
    return [...grouped.entries()].map(([provinceId, entry]) => ({
      provinceId,
      name: entry.name,
      count: entry.count,
      latitude: entry.sumLat / entry.count,
      longitude: entry.sumLng / entry.count,
    }));
  }, [allSquares, selectedProvinceId]);

  // On mount: load provinces + ALL squares in parallel so every red dot
  // is visible immediately, regardless of dropdown selection.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && setStatus("loading"));
    void Promise.allSettled([getProvinces(), getAllSquares()]).then(([provincesResult, squaresResult]) => {
      if (!active) return;
      if (provincesResult.status === "fulfilled") {
        setProvinces(provincesResult.value);
        setSelectedProvinceId(provincesResult.value[0]?.id || 0);
      } else {
        setError("دریافت استان‌ها با خطا مواجه شد.");
      }
      if (squaresResult.status === "fulfilled") {
        setAllSquares(squaresResult.value);
        setActiveCount(squaresResult.value.length);
      } else {
        setError((current) => current ?? "دریافت میدان‌ها با خطا مواجه شد.");
      }
      setStatus("ready");
    });
    return () => {
      active = false;
    };
  }, []);

  // After provinces load, get cities for the selected province.
  useEffect(() => {
    if (!selectedProvinceId) return;
    void getCities(selectedProvinceId)
      .then((items) => {
        setProvinceCities(items);
        setSelectedCityId(items[0]?.id || 0);
      })
      .catch(() => setError("دریافت شهرها با خطا مواجه شد."));
  }, [selectedProvinceId]);

  // When a city is picked, focus the map on that city's squares and
  // fill the info list (all dots stay visible — selection only moves
  // the view and changes the list).
  useEffect(() => {
    if (!selectedCityId) return;
    let active = true;
    void getCityMap(selectedCityId)
      .then(({ squares, center }) => {
        if (!active) return;
        setCitySquares(squares);
        setFocus(center);
      })
      .catch(() => {
        if (!active) return;
        setCitySquares([]);
        setFocus(null);
      });
    return () => {
      active = false;
    };
  }, [selectedCityId]);

  const selectProvince = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedCityId(0);
    setCityQuery("");
    setFocus(null);
    setCitySquares([]);
  };

  const selectCity = (cityId: number) => setSelectedCityId(cityId);

  return { selectedProvince, selectedCity, selectedProvinceId, selectedCityId, provinceCities, visibleProvinces, visibleCities, provinceQuery, cityQuery, squares: selectedSquares, aggregates: otherAggregates, citySquares, center: focus, status, error, activeCount, selectProvince, selectCity, setProvinceQuery, setCityQuery };
}
